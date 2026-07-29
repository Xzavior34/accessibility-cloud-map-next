"use client";

import { useCallback, useState } from 'react';
import type { PlaceInfoFeature } from '../types/accessibilityCloud';

export interface FavoritePlace {
  id: string;
  name: string;
  category?: string;
  lat: number;
  lng: number;
  savedAt: number;
}

const STORAGE_KEY = 'a11y-map-favorites';

function readFavorites(): FavoritePlace[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Saved/favorite places — for quick repeat access to places someone visits often (home, work, clinic, etc.). */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoritePlace[]>(() => readFavorites());

  const persist = useCallback((next: FavoritePlace[]) => {
    setFavorites(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[useFavorites] Failed to save', e);
    }
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (place: PlaceInfoFeature) => {
      const id = place.properties._id;
      if (favorites.some((f) => f.id === id)) {
        persist(favorites.filter((f) => f.id !== id));
      } else {
        const [lng, lat] = place.geometry.coordinates;
        persist([
          ...favorites,
          {
            id,
            name: place.properties.name || 'Unnamed place',
            category: place.properties.category,
            lat,
            lng,
            savedAt: Date.now(),
          },
        ]);
      }
    },
    [favorites, persist],
  );

  const removeFavorite = useCallback(
    (id: string) => persist(favorites.filter((f) => f.id !== id)),
    [favorites, persist],
  );

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
