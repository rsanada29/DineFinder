// Parses hours strings (12h, 24h, next-day wrap) and checks if open now.

interface TimeRange {
  open: number;  // minutes since midnight
  close: number;
}

export function getOpenStatus(hours: string): { isOpen: boolean; label: string } {
  if (!hours) return { isOpen: false, label: '' };

  const trimmed = hours.trim();

  // "Open 24 hours"
  if (/open\s*24/i.test(trimmed)) {
    return { isOpen: true, label: 'Open 24 hours' };
  }

  // "Closed" (whole-day closed)
  if (/^closed$/i.test(trimmed)) {
    return { isOpen: false, label: 'Closed today' };
  }

  // Parse all time ranges (comma-separated)
  const ranges = parseTimeRanges(trimmed);
  if (ranges.length === 0) return { isOpen: false, label: '' };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Check if currently open in any range
  const currentRange = ranges.find((r) => isWithinRange(currentMinutes, r.open, r.close));

  if (currentRange) {
    return {
      isOpen: true,
      label: `Open · til ${formatTime(currentRange.close)}`,
    };
  }

  // Closed — find next opening time
  const sorted = [...ranges].sort((a, b) => a.open - b.open);
  const next = sorted.find((r) => r.open > currentMinutes) ?? sorted[0];
  return {
    isOpen: false,
    label: `Closed · Opens ${formatTime(next.open)}`,
  };
}

// Split a comma-separated hours string into individual time ranges
export function parseTimeRanges(hours: string): TimeRange[] {
  const ranges: TimeRange[] = [];
  const parts = hours.split(/,/).map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    const range = parseRange(part);
    if (range) ranges.push(range);
  }

  return ranges;
}

// Try to parse a single "open - close" string
function parseRange(part: string): TimeRange | null {
  // 1. Full AM/PM on both sides: "11:30 AM – 10:00 PM"
  const fullMatch = part.match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)\s*[–\-~〜]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i
  );
  if (fullMatch) {
    return {
      open: to24Minutes(parseInt(fullMatch[1]), parseInt(fullMatch[2]), fullMatch[3].toUpperCase() as 'AM' | 'PM'),
      close: to24Minutes(parseInt(fullMatch[4]), parseInt(fullMatch[5]), fullMatch[6].toUpperCase() as 'AM' | 'PM'),
    };
  }

  // 2. AM/PM only on close: "12:00 – 3:00 PM" (Google Australia format)
  const partialMatch = part.match(
    /(\d{1,2}):(\d{2})\s*[–\-~〜]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i
  );
  if (partialMatch) {
    const openH = parseInt(partialMatch[1]);
    const openM = parseInt(partialMatch[2]);
    const closeH = parseInt(partialMatch[3]);
    const closeM = parseInt(partialMatch[4]);
    const closeAmpm = partialMatch[5].toUpperCase() as 'AM' | 'PM';

    // Infer AM/PM for opening time
    const openAmpm = inferOpenAmpm(openH, closeH, closeAmpm);
    return {
      open: to24Minutes(openH, openM, openAmpm),
      close: to24Minutes(closeH, closeM, closeAmpm),
    };
  }

  // 3. 24-hour format with wave dash: "11:30~22:00", next-day prefix supported
  const jpMatch = part.match(
    /(\d{1,2}):(\d{2})\s*[〜~\-–]\s*(翌)?(\d{1,2}):(\d{2})/
  );
  if (jpMatch) {
    return {
      open: parseInt(jpMatch[1]) * 60 + parseInt(jpMatch[2]),
      close: parseInt(jpMatch[4]) * 60 + parseInt(jpMatch[5]),
    };
  }

  return null;
}

// Figure out AM/PM for the open time when only the close side has it
function inferOpenAmpm(openH: number, closeH: number, closeAmpm: 'AM' | 'PM'): 'AM' | 'PM' {
  // Convert to comparable 24h values
  const close24 = to24Minutes(closeH, 0, closeAmpm);
  const samePeriod24 = to24Minutes(openH, 0, closeAmpm);
  const oppPeriod24 = to24Minutes(openH, 0, closeAmpm === 'AM' ? 'PM' : 'AM');

  // If same period makes open < close → use same period
  if (samePeriod24 < close24) return closeAmpm;
  // If opposite period makes open < close → use opposite
  if (oppPeriod24 < close24) return closeAmpm === 'AM' ? 'PM' : 'AM';
  // Default: assume same period (overnight wrap)
  return closeAmpm;
}

// 12h → minutes since midnight
function to24Minutes(hour: number, min: number, ampm: 'AM' | 'PM'): number {
  let h = hour;
  if (ampm === 'AM' && h === 12) h = 0;
  if (ampm === 'PM' && h !== 12) h += 12;
  return h * 60 + min;
}

// minutes → "HH:MM"
function formatTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Handles ranges that wrap past midnight (e.g. 22:00–02:00)
function isWithinRange(current: number, open: number, close: number): boolean {
  if (close <= open) {
    // Wraps past midnight: e.g. 17:00–01:00
    return current >= open || current < close;
  }
  return current >= open && current < close;
}

// ~80m/min avg walking speed
export function getWalkingMinutes(distanceKm: number): number {
  return Math.max(1, Math.round(distanceKm * 1000 / 80));
}
