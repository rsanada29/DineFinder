import type { Restaurant, ReviewText } from '../types';
import { MOCK_RESTAURANTS } from '../constants/mockData';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const BASE_URL = 'https://places.googleapis.com/v1';

interface PlacePhoto {
  name: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: { displayName: string }[];
}

interface PlaceReview {
  relativePublishTimeDescription?: string;
  publishTime?: string; // ISO 8601 timestamp
  rating?: number;
  text?: { text: string };
  authorAttribution?: { displayName: string; photoUri?: string };
}

interface PlaceNew {
  id: string;
  displayName?: { text: string };
  rating?: number;
  userRatingCount?: number;
  location?: { latitude: number; longitude: number };
  priceLevel?: string;
  primaryType?: string;
  types?: string[];
  photos?: PlacePhoto[];
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  nationalPhoneNumber?: string;
  formattedAddress?: string;
  reviews?: PlaceReview[];
}

const PRICE_MAP: Record<string, { level: 1 | 2 | 3 | 4; label: string }> = {
  PRICE_LEVEL_FREE:           { level: 1, label: '$10–$20' },
  PRICE_LEVEL_INEXPENSIVE:    { level: 1, label: '$10–$20' },
  PRICE_LEVEL_MODERATE:       { level: 2, label: '$20–$40' },
  PRICE_LEVEL_EXPENSIVE:      { level: 3, label: '$50+' },
  PRICE_LEVEL_VERY_EXPENSIVE: { level: 4, label: '$100+' },
};

// Direct mapping: Google Places type → app genre.
// Specific cuisine types checked FIRST so they aren't overridden by generic types.
const TYPE_TO_GENRE: Record<string, string> = {
  // Japanese
  japanese_restaurant: 'Japanese', sushi_restaurant: 'Japanese', ramen_restaurant: 'Japanese',
  yakitori_restaurant: 'Japanese', tempura_restaurant: 'Japanese', shabu_shabu_restaurant: 'Japanese',
  sukiyaki_restaurant: 'Japanese', teppanyaki_restaurant: 'Japanese', japanese_curry_restaurant: 'Japanese',
  // Chinese
  chinese_restaurant: 'Chinese', dim_sum_restaurant: 'Chinese', hot_pot_restaurant: 'Chinese',
  taiwanese_restaurant: 'Chinese', noodle_restaurant: 'Chinese',
  // Korean
  korean_restaurant: 'Korean', korean_barbecue_restaurant: 'Korean',
  // Thai & Vietnamese
  thai_restaurant: 'Thai & Vietnamese', vietnamese_restaurant: 'Thai & Vietnamese',
  asian_restaurant: 'Thai & Vietnamese', southeast_asian_restaurant: 'Thai & Vietnamese',
  indonesian_restaurant: 'Thai & Vietnamese', malay_restaurant: 'Thai & Vietnamese',
  filipino_restaurant: 'Thai & Vietnamese',
  // Indian
  indian_restaurant: 'Indian', south_indian_restaurant: 'Indian', north_indian_restaurant: 'Indian',
  // Italian
  italian_restaurant: 'Italian',
  // Mediterranean
  mediterranean_restaurant: 'Mediterranean', greek_restaurant: 'Mediterranean',
  spanish_restaurant: 'Mediterranean', middle_eastern_restaurant: 'Mediterranean',
  turkish_restaurant: 'Mediterranean', lebanese_restaurant: 'Mediterranean',
  persian_restaurant: 'Mediterranean', mexican_restaurant: 'Mediterranean',
  shawarma_restaurant: 'Mediterranean',
  // Fine Dining
  french_restaurant: 'Fine Dining', european_restaurant: 'Fine Dining',
  portuguese_restaurant: 'Fine Dining', german_restaurant: 'Fine Dining',
  // Dessert
  dessert_restaurant: 'Dessert', ice_cream_shop: 'Dessert', patisserie: 'Dessert',
  donut_shop: 'Dessert', bubble_tea_store: 'Dessert',
  frozen_yogurt_shop: 'Dessert', juice_shop: 'Dessert', smoothie_shop: 'Dessert',
  // Cafe
  cafe: 'Cafe', coffee_shop: 'Cafe', bakery: 'Cafe',
  brunch_restaurant: 'Cafe', breakfast_restaurant: 'Cafe',
  // Bar & Grill
  bar: 'Bar & Grill', pub: 'Bar & Grill', wine_bar: 'Bar & Grill',
  cocktail_bar: 'Bar & Grill', sports_bar: 'Bar & Grill', night_club: 'Bar & Grill',
  izakaya_restaurant: 'Bar & Grill', barbecue_restaurant: 'Bar & Grill',
  steak_house: 'Bar & Grill', american_restaurant: 'Bar & Grill',
  fast_food_restaurant: 'Bar & Grill', hamburger_restaurant: 'Bar & Grill',
  sandwich_shop: 'Bar & Grill', fried_chicken_restaurant: 'Bar & Grill',
  hot_dog_restaurant: 'Bar & Grill', food_court: 'Bar & Grill',
  pizza_restaurant: 'Bar & Grill',
};

// Generic primaryTypes that should NOT override more specific types in the types array.
// e.g. a bubble tea store might have primaryType 'cafe' but types includes 'bubble_tea_store'.
const GENERIC_TYPES = new Set([
  'restaurant', 'cafe', 'coffee_shop', 'bakery', 'bar', 'pub', 'food_court',
  'barbecue_restaurant', 'steak_house',  // cooking style — defer to specific cuisine (e.g. Korean BBQ)
  'asian_fusion_restaurant', 'buffet_restaurant',  // defer to specific cuisine in types array
]);

// Low-priority genres — if found, keep scanning for something more specific.
const LOW_PRIORITY_GENRES = new Set(['Cafe', 'Bar & Grill']);

// Maps Google Places types → app cuisine categories.
// Always scans the full types array to find the most specific match.
function mapGenre(primaryType?: string, types: string[] = []): string {
  // 1. If primaryType is specific (not generic), use it directly
  if (primaryType && TYPE_TO_GENRE[primaryType] && !GENERIC_TYPES.has(primaryType)) {
    return TYPE_TO_GENRE[primaryType];
  }

  // 2. Scan types array for the most specific match
  let generic: string | null = null;
  for (const t of types) {
    const genre = TYPE_TO_GENRE[t];
    if (!genre) continue;
    // Specific cuisines: return immediately
    if (!LOW_PRIORITY_GENRES.has(genre)) return genre;
    // Low-priority: remember but keep looking for something more specific
    if (!generic) generic = genre;
  }

  // 3. Fall back to primaryType's genre, then generic from types, then default
  if (primaryType && TYPE_TO_GENRE[primaryType]) return TYPE_TO_GENRE[primaryType];
  return generic ?? 'Bar & Grill';
}

function getPhotoUrl(photoName: string): string {
  return `${BASE_URL}/${photoName}/media?maxWidthPx=800&maxHeightPx=1000&key=${API_KEY}`;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function parseReviews(raw?: PlaceReview[]): ReviewText[] {
  if (!raw) return [];
  return raw
    .filter((r) => r.text?.text && r.text.text.length > 10)
    .slice(0, 5)
    .map((r) => ({
      author: r.authorAttribution?.displayName ?? 'Anonymous',
      authorPhotoUri: r.authorAttribution?.photoUri,
      rating: r.rating ?? 5,
      text: r.text?.text ?? '',
      time: r.relativePublishTimeDescription ?? '',
      publishTime: r.publishTime,
    }));
}

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=800&fit=crop';

// Each group = 1 API call, max 20 results each.
// Stick to types supported by includedPrimaryTypes or the whole group fails.
const SEARCH_GROUPS: string[][] = [
  // 1. Japanese (20)
  ['japanese_restaurant', 'sushi_restaurant', 'ramen_restaurant', 'yakitori_restaurant'],
  // 2. Chinese (20)
  ['chinese_restaurant', 'dim_sum_restaurant', 'hot_pot_restaurant', 'taiwanese_restaurant'],
  // 3. Korean (20)
  ['korean_restaurant'],
  // 4. Vietnamese & Thai (20)
  ['vietnamese_restaurant', 'thai_restaurant', 'asian_restaurant', 'indonesian_restaurant'],
  // 5. Indian (20)
  ['indian_restaurant'],
  // 6. Italian (20)
  ['italian_restaurant'],
  // 7. Mediterranean (20)
  ['mediterranean_restaurant', 'greek_restaurant', 'spanish_restaurant',
   'middle_eastern_restaurant', 'turkish_restaurant', 'lebanese_restaurant',
   'persian_restaurant', 'mexican_restaurant'],
  // 8. Fine Dining (20)
  ['french_restaurant', 'european_restaurant', 'portuguese_restaurant',
   'german_restaurant'],
  // 9. Dessert & Drinks (20)
  ['ice_cream_shop', 'dessert_restaurant', 'donut_shop', 'juice_shop'],
  // 10. Cafe & Brunch (20)
  ['cafe', 'coffee_shop', 'brunch_restaurant', 'breakfast_restaurant',
   'sandwich_shop', 'bakery'],
  // 11. Bar & Grill (20)
  ['bar', 'pub', 'wine_bar', 'cocktail_bar', 'sports_bar',
   'barbecue_restaurant', 'steak_house', 'american_restaurant'],
  // 12. Fast food (20)
  ['fast_food_restaurant', 'hamburger_restaurant', 'pizza_restaurant'],
  // 13. General restaurants (20)
  ['restaurant'],
  // 14. Seafood & other (20)
  ['seafood_restaurant', 'vegan_restaurant', 'vegetarian_restaurant'],
];

// primaryType must be one of these to be included in results
const VALID_PRIMARY_TYPES = new Set([
  'restaurant', 'cafe', 'bar', 'pub', 'bakery', 'coffee_shop',
  'fast_food_restaurant', 'hamburger_restaurant', 'pizza_restaurant',
  'sandwich_shop', 'ice_cream_shop', 'dessert_restaurant',
  'italian_restaurant', 'french_restaurant', 'japanese_restaurant',
  'sushi_restaurant', 'ramen_restaurant', 'chinese_restaurant',
  'korean_restaurant', 'thai_restaurant', 'vietnamese_restaurant',
  'indian_restaurant', 'mexican_restaurant', 'mediterranean_restaurant',
  'greek_restaurant', 'spanish_restaurant', 'turkish_restaurant',
  'lebanese_restaurant', 'middle_eastern_restaurant', 'american_restaurant',
  'barbecue_restaurant', 'steak_house', 'seafood_restaurant',
  'asian_restaurant', 'southeast_asian_restaurant', 'indonesian_restaurant',
  'filipino_restaurant', 'malay_restaurant', 'taiwanese_restaurant',
  'dim_sum_restaurant', 'hot_pot_restaurant', 'noodle_restaurant',
  'european_restaurant', 'german_restaurant', 'portuguese_restaurant',
  'persian_restaurant', 'wine_bar', 'cocktail_bar', 'sports_bar',
  'izakaya_restaurant', 'yakitori_restaurant', 'tempura_restaurant',
  'shabu_shabu_restaurant', 'sukiyaki_restaurant', 'teppanyaki_restaurant',
  'japanese_curry_restaurant', 'fried_chicken_restaurant',
  'hot_dog_restaurant', 'donut_shop', 'patisserie', 'bubble_tea_store',
  'frozen_yogurt_shop', 'juice_shop', 'smoothie_shop',
  'food_court', 'brunch_restaurant', 'breakfast_restaurant',
  'vegan_restaurant', 'vegetarian_restaurant',
  'korean_barbecue_restaurant', 'south_indian_restaurant', 'north_indian_restaurant',
  'asian_fusion_restaurant', 'buffet_restaurant', 'shawarma_restaurant',
]);

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.rating',
  'places.userRatingCount',
  'places.location',
  'places.priceLevel',
  'places.primaryType',
  'places.types',
  'places.photos.name',
  'places.photos.widthPx',
  'places.photos.heightPx',
  'places.photos.authorAttributions',
  'places.regularOpeningHours',
  'places.nationalPhoneNumber',
  'places.formattedAddress',
  'places.reviews',
].join(',');

const EXCLUDED_TYPES = [
  'grocery_store', 'supermarket', 'convenience_store', 'gas_station',
  'department_store', 'shopping_mall', 'food_store', 'liquor_store',
  'hotel', 'lodging', 'motel', 'tourist_attraction', 'museum',
  'park', 'transit_station', 'market', 'night_club',
];

/** Fetch one category group from the API (max 20 results). */
async function fetchGroup(
  types: string[],
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<PlaceNew[]> {
  const res = await fetch(`${BASE_URL}/places:searchNearby`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY!,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      includedPrimaryTypes: types,
      excludedPrimaryTypes: EXCLUDED_TYPES,
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters,
        },
      },
      languageCode: 'en',
    }),
  });
  const data = await res.json();
  if (data.error) {
    console.warn(`[MeshiMatch] API error for ${types[0]}:`, data.error.message);
  }
  return (data.places as PlaceNew[] | undefined) ?? [];
}

/** Check if a raw place passes our quality filter. */
function isValidFoodPlace(place: PlaceNew): boolean {
  if (place.primaryType && !VALID_PRIMARY_TYPES.has(place.primaryType)) return false;
  // No photo requirement — fallback image is used in toRestaurant()
  if (!place.displayName?.text) return false;
  return true;
}

/** Convert a raw PlaceNew into our Restaurant model. */
function toRestaurant(place: PlaceNew, lat: number, lng: number): Restaurant {
  const loc = place.location ?? { latitude: lat, longitude: lng };
  const priceInfo = PRICE_MAP[place.priceLevel ?? ''] ?? { level: 2 as const, label: '$20–$40' };

  const allPhotos = place.photos ?? [];
  const sorted = [...allPhotos].sort((a, b) => {
    const idxA = allPhotos.indexOf(a);
    const idxB = allPhotos.indexOf(b);
    if (idxA === 0) return -1;
    if (idxB === 0) return 1;
    const ratioA = (a.heightPx ?? 1) / (a.widthPx ?? 1);
    const ratioB = (b.heightPx ?? 1) / (b.widthPx ?? 1);
    return ratioB - ratioA;
  });
  const topPhotos = sorted.slice(0, 6);
  const photos = topPhotos.map((p) => getPhotoUrl(p.name));
  const photoAttributions = topPhotos.map(
    (p) => p.authorAttributions?.[0]?.displayName ?? ''
  );

  return {
    id: place.id,
    name: place.displayName?.text ?? '(Unknown)',
    genre: mapGenre(place.primaryType, place.types),
    rating: place.rating ?? 4.0,
    reviews: place.userRatingCount ?? 0,
    distance: calculateDistance(lat, lng, loc.latitude, loc.longitude),
    price: priceInfo.label,
    priceLevel: priceInfo.level,
    phone: place.nationalPhoneNumber ?? '',
    address: place.formattedAddress ?? '',
    hours: (() => {
      const descs = place.regularOpeningHours?.weekdayDescriptions;
      if (!descs) return '';
      const todayIdx = (new Date().getDay() + 6) % 7;
      const full = descs[todayIdx] ?? descs[0] ?? '';
      return full.replace(/^[^:]+:\s*/, '');
    })(),
    lat: loc.latitude,
    lng: loc.longitude,
    photos: photos.length > 0 ? photos : [FALLBACK_PHOTO],
    photoAttributions: photos.length > 0 ? photoAttributions : [],
    reviewTexts: parseReviews(place.reviews),
  };
}

/** Fetch a single place by ID to refresh stale cached data. */
export async function fetchPlaceById(
  placeId: string,
  userLat: number,
  userLng: number
): Promise<Restaurant | null> {
  if (!API_KEY) return null;
  try {
    const fieldMask = [
      'id', 'displayName', 'rating', 'userRatingCount', 'location',
      'priceLevel', 'primaryType', 'types', 'photos.name', 'photos.widthPx',
      'photos.heightPx', 'photos.authorAttributions', 'regularOpeningHours',
      'nationalPhoneNumber', 'formattedAddress', 'reviews',
    ].join(',');
    const res = await fetch(`${BASE_URL}/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': fieldMask,
      },
    });
    const data = await res.json();
    if (data.error || !data.id) return null;
    const place = data as PlaceNew;
    const r = toRestaurant(place, userLat, userLng);
    r.fetchedAt = Date.now();
    return r;
  } catch (e) {
    console.warn(`[MeshiMatch] fetchPlaceById(${placeId}) failed:`, e);
    return null;
  }
}

export async function fetchNearbyRestaurants(
  lat: number,
  lng: number,
  radiusMeters = 3000
): Promise<Restaurant[]> {
  if (!API_KEY) {
    return MOCK_RESTAURANTS.map((r) => ({
      ...r,
      distance: calculateDistance(lat, lng, r.lat, r.lng),
    }));
  }

  try {
    // Fire all category groups in parallel — each returns up to 20 places
    console.log(`[MeshiMatch] Fetching ${SEARCH_GROUPS.length} groups, radius=${radiusMeters}m`);
    const groupResults = await Promise.all(
      SEARCH_GROUPS.map((types) => fetchGroup(types, lat, lng, radiusMeters))
    );

    // Log per-group results
    SEARCH_GROUPS.forEach((types, i) => {
      console.log(`[MeshiMatch] Group ${i + 1} (${types[0]}): ${groupResults[i].length} results`);
    });

    // Merge & deduplicate by place ID.
    // Process specific-cuisine groups first so they aren't "stolen" by generic groups.
    // Generic groups (containing only generic types like 'restaurant','cafe','bar') go last.
    const GENERIC_GROUP_TYPES = new Set(['restaurant', 'cafe', 'bar', 'coffee_shop', 'bakery', 'pub']);
    const isGenericGroup = (types: string[]) => types.every(t => GENERIC_GROUP_TYPES.has(t));
    const groupOrder = SEARCH_GROUPS
      .map((types, i) => ({ types, i }))
      .sort((a, b) => {
        const aGeneric = isGenericGroup(a.types) ? 1 : 0;
        const bGeneric = isGenericGroup(b.types) ? 1 : 0;
        if (aGeneric !== bGeneric) return aGeneric - bGeneric;
        // Among non-generic groups, fewer types = more specific = process first
        return a.types.length - b.types.length;
      });

    const seen = new Set<string>();
    const allPlaces: PlaceNew[] = [];
    for (const { i } of groupOrder) {
      for (const place of groupResults[i]) {
        if (!seen.has(place.id)) {
          seen.add(place.id);
          allPlaces.push(place);
        }
      }
    }

    console.log(`[MeshiMatch] Total unique places: ${allPlaces.length}`);

    if (allPlaces.length === 0) {
      console.warn('[MeshiMatch] No results from any group — using mock data');
      return MOCK_RESTAURANTS.map((r) => ({
        ...r,
        distance: calculateDistance(lat, lng, r.lat, r.lng),
      }));
    }

    // Filter & convert
    const rejected = allPlaces.filter(p => !isValidFoodPlace(p));
    rejected.forEach(p => {
      const reason = !p.displayName?.text ? 'no name'
        : (p.primaryType && !VALID_PRIMARY_TYPES.has(p.primaryType)) ? `bad primaryType: ${p.primaryType}`
        : 'unknown';
      console.log(`[MeshiMatch] REJECTED: "${p.displayName?.text ?? '?'}" ${reason} primaryType=${p.primaryType}`);
    });
    // Track Korean through each step
    const koreanInAll = allPlaces.filter(p => p.primaryType === 'korean_restaurant');
    const foodPlaces = allPlaces.filter(isValidFoodPlace);
    const koreanInFood = foodPlaces.filter(p => p.primaryType === 'korean_restaurant');
    console.log(`[MeshiMatch] Korean tracking: ${koreanInAll.length} in allPlaces → ${koreanInFood.length} after quality filter`);
    console.log(`[MeshiMatch] After quality filter: ${foodPlaces.length} (${rejected.length} rejected)`);

    if (foodPlaces.length === 0) {
      console.warn('[MeshiMatch] No food places after filtering — using mock data');
      return MOCK_RESTAURANTS.map((r) => ({
        ...r,
        distance: calculateDistance(lat, lng, r.lat, r.lng),
      }));
    }

    const now = Date.now();
    const results = foodPlaces.map((p) => ({ ...toRestaurant(p, lat, lng), fetchedAt: now }));

    // Check if Korean places got reclassified
    const koreanFinal = results.filter(r => r.genre === 'Korean');
    const koreanPrimaryButNotGenre = results.filter(r =>
      foodPlaces.find(p => p.id === r.id)?.primaryType === 'korean_restaurant' && r.genre !== 'Korean'
    );
    if (koreanPrimaryButNotGenre.length > 0) {
      koreanPrimaryButNotGenre.forEach(r => {
        const place = foodPlaces.find(p => p.id === r.id);
        console.log(`[MeshiMatch] Korean→${r.genre}: "${r.name}" types=${place?.types?.slice(0, 5).join(',')}`);
      });
    }
    console.log(`[MeshiMatch] Korean: ${koreanInFood.length} after filter → ${koreanFinal.length} after mapGenre`);

    // Log genre distribution
    const genreCounts: Record<string, number> = {};
    for (const r of results) {
      genreCounts[r.genre] = (genreCounts[r.genre] ?? 0) + 1;
    }
    console.log(`[MeshiMatch] Final: ${results.length} restaurants`, genreCounts);

    // Sort by distance — closest first
    return results.sort((a, b) => a.distance - b.distance);
  } catch (err) {
    console.warn('fetchNearbyRestaurants failed, falling back to mock data:', err);
    return MOCK_RESTAURANTS.map((r) => ({
      ...r,
      distance: calculateDistance(lat, lng, r.lat, r.lng),
    }));
  }
}
