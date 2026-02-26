export interface ReviewText {
  author: string;
  authorPhotoUri?: string;
  rating: number;
  text: string;
  time: string;
  publishTime?: string; // ISO 8601 timestamp for sorting
}

export interface Restaurant {
  id: string;
  name: string;
  genre: string;
  rating: number;
  reviews: number;
  distance: number;
  price: string;
  priceLevel: 1 | 2 | 3 | 4;
  phone: string;
  address: string;
  hours: string;
  lat: number;
  lng: number;
  photos: string[];
  photoAttributions?: string[];
  reviewTexts?: ReviewText[];
  fetchedAt?: number; // epoch ms — when data was last fetched from Places API
}

export interface Group {
  id: string;
  name: string;
  code: string;
  members: string[];
  swipes: Record<string, string[]>;
  memberProfiles?: Record<string, { name: string; photoUri?: string }>;
  createdAt: number;
  createdBy: string;
}

export interface Filters {
  maxDistance: number;
  genres: string[];
  sort: 'distance' | 'rating' | 'reviews' | 'priceAsc' | 'priceDesc';
  priceLevels: number[];
  mealTime: 'all' | 'lunch' | 'dinner';
}

export type SwipeDirection = 'left' | 'right';

export interface User {
  id: string;
  name: string;
  email?: string;
  photoUri?: string;
}
