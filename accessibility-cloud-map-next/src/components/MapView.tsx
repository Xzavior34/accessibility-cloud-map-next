"use client";

import { useEffect, useRef } from 'react';
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  GeolocateControl,
  type GeoJSONSource,
  type MapLayerMouseEvent,
} from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import type {
  DisruptionFeature,
  EquipmentInfoFeature,
  PlaceInfoFeature,
} from '../types/accessibilityCloud';
import { wheelchairStatus } from '../types/accessibilityCloud';
import type { Viewport } from '../hooks/useAccessibilityData';

const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

interface MapViewProps {
  places: PlaceInfoFeature[];
  disruptions: DisruptionFeature[];
  equipment: EquipmentInfoFeature[];
  onViewportChange: (viewport: Viewport) => void;
  onSelectPlace: (place: PlaceInfoFeature) => void;
  flyTo: { lat: number; lng: number; zoom?: number } | null;
  userLocation: { lat: number; lng: number } | null;
}

function placesToGeoJson(places: PlaceInfoFeature[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: places.map((p) => ({
      type: 'Feature',
      geometry: p.geometry,
      properties: {
        ...p.properties,
        status: wheelchairStatus(p.properties.accessibility),
      },
    })),
  };
}

function pointsToGeoJson(
  features: Array<DisruptionFeature | EquipmentInfoFeature>,
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: features.map((f) => ({
      type: 'Feature',
      geometry: f.geometry,
      properties: { ...f.properties },
    })),
  };
}

export function MapView({
  places,
  disruptions,
  equipment,
  onViewportChange,
  onSelectPlace,
  flyTo,
  userLocation,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const loadedRef = useRef(false);
  const userMarkerRef = useRef<Marker | null>(null);
  const onViewportChangeRef = useRef(onViewportChange);
  const onSelectPlaceRef = useRef(onSelectPlace);
  const placesRef = useRef(places);

  // Keep "latest value" refs in sync via an effect rather than mutating
  // them directly during render (mutating refs during render isn't safe
  // under concurrent rendering).
  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
    onSelectPlaceRef.current = onSelectPlace;
    placesRef.current = places;
  });

  // Initialize the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: [13.405, 52.52], // Berlin — Sozialhelden's home city, well-covered by data
      zoom: 13,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new GeolocateControl({ trackUserLocation: true }), 'top-right');

    const emitViewport = () => {
      const b = map.getBounds();
      const c = map.getCenter();
      onViewportChangeRef.current({
        bounds: { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() },
        center: { lat: c.lat, lng: c.lng },
        zoom: map.getZoom(),
      });
    };

    map.on('load', () => {
      loadedRef.current = true;

      map.addSource('places', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'places-circles',
        type: 'circle',
        source: 'places',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 16, 9],
          'circle-color': [
            'match',
            ['get', 'status'],
            'full', '#16a34a',
            'partial', '#f59e0b',
            'none', '#dc2626',
            /* unknown */ '#6b7280',
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.addSource('disruptions', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'disruptions-symbols',
        type: 'symbol',
        source: 'disruptions',
        layout: {
          'text-field': '⚠',
          'text-size': 18,
          'text-allow-overlap': true,
        },
      });

      map.addSource('equipment', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'equipment-symbols',
        type: 'symbol',
        source: 'equipment',
        layout: {
          'text-field': [
            'match',
            ['get', 'category'],
            'elevator', '🛗',
            'escalator', '⬆',
            '❓',
          ],
          'text-size': 16,
          'text-allow-overlap': true,
        },
        paint: {
          'text-opacity': ['case', ['==', ['get', 'isWorking'], false], 0.5, 1],
        },
      });

      map.on('click', 'places-circles', (e: MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f) return;
        const place = placesRef.current.find((p) => p.properties._id === f.properties?._id);
        if (place) onSelectPlaceRef.current(place);
      });
      map.on('mouseenter', 'places-circles', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'places-circles', () => {
        map.getCanvas().style.cursor = '';
      });

      emitViewport();
    });

    map.on('moveend', emitViewport);

    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  // Update place data.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const source = map.getSource('places') as GeoJSONSource | undefined;
    source?.setData(placesToGeoJson(places));
  }, [places]);

  // Update disruption data.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const source = map.getSource('disruptions') as GeoJSONSource | undefined;
    source?.setData(pointsToGeoJson(disruptions));
  }, [disruptions]);

  // Update equipment data.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const source = map.getSource('equipment') as GeoJSONSource | undefined;
    source?.setData(pointsToGeoJson(equipment));
  }, [equipment]);

  // Fly to a searched location.
  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: flyTo.zoom ?? 15 });
  }, [flyTo]);

  // User location marker — distinct from the built-in GeolocateControl dot,
  // driven by the same location data used for distances/directions elsewhere
  // in the app, so everything stays consistent.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    if (!userLocation) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.borderRadius = '50%';
      el.style.background = '#2563eb';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.4), 0 2px 6px rgba(0,0,0,0.3)';
      userMarkerRef.current = new Marker({ element: el });
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]).addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    }
  }, [userLocation]);

  return <div ref={containerRef} className="absolute inset-0" />;
}