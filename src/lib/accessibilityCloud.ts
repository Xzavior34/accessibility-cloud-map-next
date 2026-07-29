import type {
  CategoriesResponse,
  DisruptionFeature,
  EquipmentInfoFeature,
  FeatureCollection,
  GlobalStatsResponse,
  ImagesResponse,
  PlaceInfoFeature,
  WheelchairFilterPreset,
} from '../types/accessibilityCloud';
import type { TileCoord } from './tileMath';

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────
//
// The cached base URL is recommended for all map-browsing use cases (up to
// 5 min stale, CDN-backed, fast). Use the uncached base URL only for
// real-time needs (e.g. right after submitting an edit).
//
// NOTE: this matches the exact URL shown on the account dashboard's own
// "Getting started" curl example for the real app token in use — trusted
// over the general repo docs, since it's specific to this account/token.
const BASE_URL = 'https://accessibility-cloud.freetls.fastly.net';

// Real app token for the "Comfeee" app on accessibility.cloud. Falls back to
// Sozialhelden's public demo token (from their example widget repo) only if
// no env var is set, so local clones without .env.local still work for a
// quick look.
const DEMO_APP_TOKEN = '7f039b60e27a4d02b13c5ad79fbe9d7b';

export const APP_TOKEN = process.env.NEXT_PUBLIC_AC_APP_TOKEN || DEMO_APP_TOKEN;

function buildUrl(path: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('appToken', APP_TOKEN);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let reason = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      reason = body?.error?.reason || reason;
    } catch {
      // ignore — use status-based reason
    }
    throw new Error(reason);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// /place-infos
// ─────────────────────────────────────────────────────────────

export interface PlaceInfoQueryOptions {
  filter?: WheelchairFilterPreset;
  includeCategories?: string[];
  excludeCategories?: string[];
  includePlacesWithoutAccessibility?: boolean;
}

/**
 * Fetches places for a single x/y/z map tile — the pattern accessibility.cloud
 * recommends for map libraries (cacheable, bounded response size), rather than
 * a radius search on every pan.
 */
export async function fetchPlaceInfosForTile(
  tile: TileCoord,
  options: PlaceInfoQueryOptions = {},
): Promise<FeatureCollection<PlaceInfoFeature>> {
  const url = buildUrl('/place-infos.json', {
    x: tile.x,
    y: tile.y,
    z: tile.z,
    filter: options.filter,
    includeCategories: options.includeCategories?.join(','),
    excludeCategories: options.excludeCategories?.join(','),
    includePlacesWithoutAccessibility: options.includePlacesWithoutAccessibility ? 1 : undefined,
    limit: 1000,
  });
  return getJson(url);
}

/** Radius search — only for explicit "near me" style searches, per API docs. */
export async function fetchPlaceInfosNear(
  lat: number,
  lng: number,
  accuracyMeters: number,
  options: PlaceInfoQueryOptions = {},
): Promise<FeatureCollection<PlaceInfoFeature>> {
  const url = buildUrl('/place-infos.json', {
    latitude: lat,
    longitude: lng,
    accuracy: Math.min(accuracyMeters, 10000),
    filter: options.filter,
    includeCategories: options.includeCategories?.join(','),
    excludeCategories: options.excludeCategories?.join(','),
    includePlacesWithoutAccessibility: options.includePlacesWithoutAccessibility ? 1 : undefined,
    limit: 1000,
  });
  return getJson(url);
}

export async function fetchPlaceInfoById(id: string): Promise<PlaceInfoFeature> {
  const url = buildUrl(`/place-infos/${id}.json`, {});
  return getJson(url);
}

// ─────────────────────────────────────────────────────────────
// /disruptions and /equipment-infos (radius search only — no tile endpoint)
// ─────────────────────────────────────────────────────────────

export async function fetchDisruptionsNear(
  lat: number,
  lng: number,
  accuracyMeters: number,
): Promise<FeatureCollection<DisruptionFeature>> {
  const url = buildUrl('/disruptions.json', {
    latitude: lat,
    longitude: lng,
    accuracy: Math.min(accuracyMeters, 10000),
    limit: 1000,
  });
  return getJson(url);
}

export async function fetchEquipmentInfosNear(
  lat: number,
  lng: number,
  accuracyMeters: number,
): Promise<FeatureCollection<EquipmentInfoFeature>> {
  const url = buildUrl('/equipment-infos.json', {
    latitude: lat,
    longitude: lng,
    accuracy: Math.min(accuracyMeters, 10000),
    limit: 1000,
  });
  return getJson(url);
}

// ─────────────────────────────────────────────────────────────
// /categories
// ─────────────────────────────────────────────────────────────

export async function fetchCategories(locale = 'en'): Promise<CategoriesResponse> {
  const url = buildUrl('/categories.json', { locale });
  return getJson(url);
}

// ─────────────────────────────────────────────────────────────
// /global-stats
// ─────────────────────────────────────────────────────────────

export async function fetchGlobalStat(name: string): Promise<GlobalStatsResponse> {
  const url = buildUrl('/global-stats.json', {
    name,
    sort: 'date',
    descending: 1,
    limit: 1,
  });
  return getJson(url);
}

// ─────────────────────────────────────────────────────────────
// /images
// ─────────────────────────────────────────────────────────────

export async function fetchPlaceImages(placeId: string, locale = 'en'): Promise<ImagesResponse> {
  const url = buildUrl('/images', { context: 'place', objectId: placeId, locale });
  return getJson(url);
}
