import { db, isFirebaseConfigured } from './firebase';
import { useAuthStore } from '../store/useAuthStore';

type EventParams = Record<string, string | number | boolean | undefined>;

/**
 * Log an analytics event to Firestore (analytics_events collection).
 * Events are batched in-memory and flushed every 5 seconds to reduce writes.
 */

let eventBuffer: Array<{
  event: string;
  params: EventParams;
  userId: string;
  timestamp: number;
}> = [];

let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushEvents(): Promise<void> {
  if (!db || eventBuffer.length === 0) return;
  const batch = [...eventBuffer];
  eventBuffer = [];

  try {
    const { collection, addDoc } = await import('firebase/firestore');
    const ref = collection(db, 'analytics_events');
    // Write each event (Firestore batch writes require same-collection refs)
    await Promise.allSettled(
      batch.map((e) => addDoc(ref, e))
    );
  } catch (e) {
    console.warn('[Analytics] Failed to flush events:', e);
    // Put failed events back
    eventBuffer = [...batch, ...eventBuffer];
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushEvents();
  }, 5000);
}

export function logEvent(event: string, params?: EventParams): void {
  if (!isFirebaseConfigured) return;

  const userId = useAuthStore.getState().user?.uid ?? 'anonymous';
  eventBuffer.push({
    event,
    params: params ?? {},
    userId,
    timestamp: Date.now(),
  });
  scheduleFlush();
}
