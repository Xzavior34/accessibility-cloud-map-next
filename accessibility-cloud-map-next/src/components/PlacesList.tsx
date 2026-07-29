"use client";

import { Navigation2, Star, X, MapPin } from 'lucide-react';
import { formatDistance, estimateWalkMinutes, haversineDistanceMeters, walkingDirectionsUrl } from '../lib/distance';
import { wheelchairStatus } from '../types/accessibilityCloud';
import type { PlaceInfoFeature } from '../types/accessibilityCloud';
import type { DisruptionFeature } from '../types/accessibilityCloud';

interface PlacesListProps {
  places: PlaceInfoFeature[];
  userLocation: { lat: number; lng: number } | null;
  disruptions: DisruptionFeature[];
  favoriteIds: string[];
  onToggleFavorite: (place: PlaceInfoFeature) => void;
  onSelectPlace: (place: PlaceInfoFeature) => void;
  onClose: () => void;
}

const STATUS_DOT: Record<string, string> = {
  full: 'bg-full',
  partial: 'bg-partial',
  none: 'bg-none',
  unknown: 'bg-unknown',
};

/** Has an active disruption been reported at/near this place? (matched by placeInfoId). */
function hasNearbyDisruption(placeId: string, disruptions: DisruptionFeature[]): boolean {
  return disruptions.some((d) => d.properties.placeInfoId === placeId);
}

export function PlacesList({
  places,
  userLocation,
  disruptions,
  favoriteIds,
  onToggleFavorite,
  onSelectPlace,
  onClose,
}: PlacesListProps) {
  const sorted = [...places]
    .map((p) => {
      const [lng, lat] = p.geometry.coordinates;
      const distance = userLocation ? haversineDistanceMeters(userLocation, { lat, lng }) : null;
      return { place: p, distance, lat, lng };
    })
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

  return (
    <div className="w-96 max-w-[92vw] bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col max-h-[calc(100dvh-2rem)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">
          Nearby accessible places {places.length > 0 && `(${places.length})`}
        </h2>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100" aria-label="Close list">
          <X className="w-4 h-4" />
        </button>
      </div>

      <ul className="overflow-y-auto divide-y divide-gray-50" aria-label="Nearby accessible places">
        {sorted.length === 0 && (
          <li className="px-4 py-6 text-sm text-gray-400 text-center">
            No places found in this area — try panning the map or widening your filters.
          </li>
        )}
        {sorted.map(({ place, distance, lat, lng }) => {
          const status = wheelchairStatus(place.properties.accessibility);
          const isFav = favoriteIds.includes(place.properties._id);
          const disrupted = hasNearbyDisruption(place.properties._id, disruptions);

          return (
            <li key={place.properties._id}>
              <button
                onClick={() => onSelectPlace(place)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 min-h-[44px]"
              >
                <span className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${STATUS_DOT[status]}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {place.properties.name || 'Unnamed place'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {place.properties.category?.replace(/_/g, ' ') || 'Place'}
                    {distance !== null && (
                      <>
                        {' · '}
                        {formatDistance(distance)} · ~{estimateWalkMinutes(distance)} min
                      </>
                    )}
                  </p>
                  {disrupted && (
                    <p className="text-xs text-amber-600 font-medium mt-0.5">
                      ⚠ Nearby elevator/escalator disruption reported
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(place);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        onToggleFavorite(place);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                    aria-label={isFav ? 'Remove from saved places' : 'Save this place'}
                  >
                    <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
                  </span>
                  <a
                    href={walkingDirectionsUrl({ lat, lng }, userLocation ?? undefined)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                    aria-label={`Get walking directions to ${place.properties.name || 'this place'}`}
                  >
                    <Navigation2 className="w-4 h-4 text-accent" />
                  </a>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {!userLocation && (
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          Enable location to see distances and sort by nearest first.
        </div>
      )}
    </div>
  );
}
