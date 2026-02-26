import * as Location from 'expo-location';

export interface Coords {
  lat: number;
  lng: number;
}

// Default: Melbourne CBD, Australia
export const DEFAULT_COORDS: Coords = { lat: -37.8136, lng: 144.9631 };

export async function getUserLocation(): Promise<Coords> {
  try {
    // Request permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission denied');
      return DEFAULT_COORDS;
    }

    // Try last known position first (instant)
    try {
      const last = await Location.getLastKnownPositionAsync({ maxAge: 120_000 });
      if (last && last.coords.accuracy && last.coords.accuracy < 200) {
        return { lat: last.coords.latitude, lng: last.coords.longitude };
      }
    } catch {
      // ignore
    }

    // Get fresh location with 15 second timeout
    const loc = await new Promise<Location.LocationObject>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Location timed out after 15s')),
        15_000
      );
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        .then((result) => { clearTimeout(timer); resolve(result); })
        .catch((err) => { clearTimeout(timer); reject(err); });
    });

    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  } catch (err) {
    console.warn('getUserLocation failed:', err);
    return DEFAULT_COORDS;
  }
}
