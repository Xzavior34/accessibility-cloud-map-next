"use client";

import { useEffect, useState } from 'react';

export interface UserLocationState {
  location: { lat: number; lng: number } | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

function initialState(): UserLocationState {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return {
      location: null,
      accuracy: null,
      error: 'Geolocation is not supported on this device.',
      loading: false,
    };
  }
  return { location: null, accuracy: null, error: null, loading: true };
}

/** Tracks the user's live position (watchPosition), so distances and "get directions" stay accurate as they move. */
export function useUserLocation(): UserLocationState {
  const [state, setState] = useState<UserLocationState>(initialState);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (err) => {
        setState((prev) => ({
          ...prev,
          error: err.message || 'Could not determine your location.',
          loading: false,
        }));
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
