"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchDisruptionsNear,
  fetchEquipmentInfosNear,
  fetchPlaceInfosForTile,
  type PlaceInfoQueryOptions,
} from '../lib/accessibilityCloud';
import { tileKey, tilesForBounds, tileZoomForMapZoom } from '../lib/tileMath';
import type {
  DisruptionFeature,
  EquipmentInfoFeature,
  PlaceInfoFeature,
} from '../types/accessibilityCloud';

export interface Viewport {
  bounds: { west: number; south: number; east: number; north: number };
  center: { lat: number; lng: number };
  zoom: number;
}

interface UseAccessibilityDataOptions {
  viewport: Viewport | null;
  filterOptions: PlaceInfoQueryOptions;
  showDisruptions: boolean;
  showEquipment: boolean;
}

interface PlacesBySignature {
  signature: string;
  map: Map<string, PlaceInfoFeature>;
}

/** Rough radius (meters) needed to cover the current viewport from its center. */
function viewportRadiusMeters(viewport: Viewport): number {
  const { bounds, center } = viewport;
  const R = 6371000;
  const dLat = ((bounds.north - center.lat) * Math.PI) / 180;
  const dLng = ((bounds.east - center.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((center.lat * Math.PI) / 180) * Math.cos((bounds.north * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.min(R * c, 10000);
}

export function useAccessibilityData({
  viewport,
  filterOptions,
  showDisruptions,
  showEquipment,
}: UseAccessibilityDataOptions) {
  const filterSignature = JSON.stringify(filterOptions);

  // Places are tagged with the filter signature they were fetched under.
  // If the active filter no longer matches the tagged signature, we treat
  // accumulated places as stale and derive an empty map instead — this
  // avoids needing an explicit "reset on filter change" effect/ref trick
  // entirely; it's just a plain derived value.
  const [placesBySignature, setPlacesBySignature] = useState<PlacesBySignature>(() => ({
    signature: filterSignature,
    map: new Map(),
  }));
  const places =
    placesBySignature.signature === filterSignature ? placesBySignature.map : new Map();

  const [disruptions, setDisruptions] = useState<DisruptionFeature[]>([]);
  const [equipment, setEquipment] = useState<EquipmentInfoFeature[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache of already-fetched tile+filter combos, so panning back over an
  // area already seen under the same filter doesn't re-fetch it. Keys are
  // namespaced by filter signature, so entries from a previous filter are
  // simply never matched again — no explicit clearing needed.
  const fetchedTileKeys = useRef<Set<string>>(new Set());

  const loadPlacesForViewport = useCallback(
    async (vp: Viewport) => {
      const tileZoom = tileZoomForMapZoom(vp.zoom);
      const tiles = tilesForBounds(vp.bounds, tileZoom);
      const tilesToFetch = tiles.filter(
        (t) => !fetchedTileKeys.current.has(`${tileKey(t)}|${filterSignature}`),
      );

      if (tilesToFetch.length === 0) return;
      // Guard against pathological huge tile counts (e.g. zoomed way out).
      const capped = tilesToFetch.slice(0, 24);

      setLoadingPlaces(true);
      setError(null);
      try {
        const results = await Promise.all(
          capped.map(async (tile) => {
            try {
              const fc = await fetchPlaceInfosForTile(tile, filterOptions);
              fetchedTileKeys.current.add(`${tileKey(tile)}|${filterSignature}`);
              return fc.features;
            } catch (e) {
              console.warn('[fetchPlaceInfosForTile]', e);
              return [];
            }
          }),
        );
        setPlacesBySignature((prev) => {
          const base = prev.signature === filterSignature ? prev.map : new Map();
          const next = new Map(base);
          for (const featureList of results) {
            for (const f of featureList) {
              next.set(f.properties._id, f);
            }
          }
          return { signature: filterSignature, map: next };
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load places');
      } finally {
        setLoadingPlaces(false);
      }
    },
    [filterSignature, filterOptions],
  );

  const loadDisruptionsAndEquipment = useCallback(
    async (vp: Viewport) => {
      const radius = viewportRadiusMeters(vp);
      if (showDisruptions) {
        try {
          const fc = await fetchDisruptionsNear(vp.center.lat, vp.center.lng, radius);
          setDisruptions(fc.features);
        } catch (e) {
          console.warn('[fetchDisruptionsNear]', e);
        }
      } else {
        setDisruptions([]);
      }

      if (showEquipment) {
        try {
          const fc = await fetchEquipmentInfosNear(vp.center.lat, vp.center.lng, radius);
          setEquipment(fc.features);
        } catch (e) {
          console.warn('[fetchEquipmentInfosNear]', e);
        }
      } else {
        setEquipment([]);
      }
    },
    [showDisruptions, showEquipment],
  );

  // Debounced fetch on viewport change.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!viewport) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadPlacesForViewport(viewport);
      loadDisruptionsAndEquipment(viewport);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [viewport, loadPlacesForViewport, loadDisruptionsAndEquipment]);

  return {
    places: Array.from(places.values()),
    disruptions,
    equipment,
    loadingPlaces,
    error,
  };
}
