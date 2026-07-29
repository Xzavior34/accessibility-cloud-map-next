"use client";

import { useEffect, useState } from 'react';
import { X, MapPin, Globe, Phone, Accessibility, Navigation2, Star, AlertTriangle } from 'lucide-react';
import { fetchPlaceImages } from '../lib/accessibilityCloud';
import { wheelchairStatus } from '../types/accessibilityCloud';
import { formatDistance, estimateWalkMinutes, haversineDistanceMeters, walkingDirectionsUrl } from '../lib/distance';
import type { AccessibilityImage, DisruptionFeature, PlaceInfoFeature } from '../types/accessibilityCloud';

interface DetailPanelProps {
  place: PlaceInfoFeature;
  onClose: () => void;
  userLocation: { lat: number; lng: number } | null;
  disruptions: DisruptionFeature[];
  isFavorite: boolean;
  onToggleFavorite: (place: PlaceInfoFeature) => void;
}

const STATUS_LABEL: Record<string, string> = {
  full: 'Fully wheelchair accessible',
  partial: 'Partially accessible',
  none: 'Not wheelchair accessible',
  unknown: 'Accessibility unknown',
};

const STATUS_COLOR: Record<string, string> = {
  full: 'text-full bg-full/10',
  partial: 'text-partial bg-partial/10',
  none: 'text-none bg-none/10',
  unknown: 'text-unknown bg-unknown/10',
};

export function DetailPanel({
  place,
  onClose,
  userLocation,
  disruptions,
  isFavorite,
  onToggleFavorite,
}: DetailPanelProps) {
  const [images, setImages] = useState<AccessibilityImage[]>([]);
  const status = wheelchairStatus(place.properties.accessibility);
  const [lng, lat] = place.geometry.coordinates;

  useEffect(() => {
    let cancelled = false;
    fetchPlaceImages(place.properties._id)
      .then((res) => {
        if (!cancelled) setImages(res.images);
      })
      .catch((e) => console.warn('[fetchPlaceImages]', e));
    return () => {
      cancelled = true;
    };
  }, [place.properties._id]);

  const { name, category, address, phoneNumber, website, _id } = place.properties;
  const distance = userLocation ? haversineDistanceMeters(userLocation, { lat, lng }) : null;
  const linkedDisruption = disruptions.find((d) => d.properties.placeInfoId === _id);

  return (
    <div className="w-80 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col max-h-[calc(100dvh-2rem)]">
      <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100">
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900 leading-tight truncate">{name || 'Unnamed place'}</h2>
          {category && <p className="text-xs text-gray-500 capitalize mt-0.5">{category.replace(/_/g, ' ')}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggleFavorite(place)}
            className="p-1.5 rounded-lg hover:bg-gray-100"
            aria-label={isFavorite ? 'Remove from saved places' : 'Save this place'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
          </button>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto px-4 py-3 flex flex-col gap-3">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${STATUS_COLOR[status]}`}>
          <Accessibility className="w-4 h-4 shrink-0" />
          {STATUS_LABEL[status]}
        </div>

        {linkedDisruption && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              A nearby {linkedDisruption.properties.category || 'elevator/escalator'} has an active
              disruption reported — consider an alternative route or entrance.
            </span>
          </div>
        )}

        {distance !== null && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 text-sm">
            <span className="text-gray-600">
              {formatDistance(distance)} away · ~{estimateWalkMinutes(distance)} min
            </span>
            <a
              href={walkingDirectionsUrl({ lat, lng }, userLocation ?? undefined)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover"
            >
              <Navigation2 className="w-3.5 h-3.5" />
              Directions
            </a>
          </div>
        )}
        {distance === null && (
          <a
            href={walkingDirectionsUrl({ lat, lng })}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover"
          >
            <Navigation2 className="w-4 h-4" />
            Get walking directions
          </a>
        )}

        {address && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
            <span>{address}</span>
          </div>
        )}

        {phoneNumber && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 shrink-0 text-gray-400" />
            <span>{phoneNumber}</span>
          </div>
        )}

        {website && (
          <a
            href={website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span className="truncate">{website}</span>
          </a>
        )}

        {images.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Community photos
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img._id}
                  src={img.url}
                  alt=""
                  className="w-full h-20 object-cover rounded-lg border border-gray-100"
                />
              ))}
            </div>
          </div>
        )}

        <p className="text-[11px] text-gray-400 pt-1">
          Data via accessibility.cloud (Sozialhelden e.V.) · ID: {place.properties._id}
        </p>
      </div>
    </div>
  );
}
