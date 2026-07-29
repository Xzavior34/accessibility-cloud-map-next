// Free, keyless OpenStreetMap-based geocoding — used only to let the user
// jump the map to a place/address they type in. Unrelated to accessibility.cloud.

export interface GeocodeResult {
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
}

interface PhotonFeature {
  properties?: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

const PHOTON_URL = process.env.NEXT_PUBLIC_PHOTON_GEOCODING_URL || 'https://photon.komoot.io/api';

export async function geocodeSearch(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];
  try {
    const url = `${PHOTON_URL}?q=${encodeURIComponent(query)}&limit=6`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding request failed');
    const data: PhotonResponse = await res.json();

    return (data.features || []).map((f) => {
      const p = f.properties || {};
      const name = p.name || p.street || 'Unnamed location';
      const addressParts = [p.street, p.city, p.state, p.country].filter(Boolean);
      return {
        name,
        subtitle: addressParts.join(', '),
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      };
    });
  } catch (e) {
    console.warn('[geocodeSearch]', e);
    return [];
  }
}
