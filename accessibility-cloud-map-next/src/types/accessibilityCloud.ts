// Types matching accessibility.cloud's JSON API response shapes.
// See: https://github.com/sozialhelden/accessibility-cloud/blob/master/app/docs/json-api.md

export type WheelchairAccessibility = true | false | 'limited' | undefined;

export interface AccessibilityInfo {
  accessibleWith?: {
    wheelchair?: WheelchairAccessibility;
  };
  partiallyAccessibleWith?: {
    wheelchair?: boolean;
  };
  notAccessibleWith?: {
    wheelchair?: boolean;
  };
}

export interface PlaceInfoProperties {
  _id: string;
  originalId?: string;
  name?: string;
  category?: string;
  address?: string;
  accessibility?: AccessibilityInfo;
  sourceId?: string;
  sourceImportId?: string;
  distance?: number;
  phoneNumber?: string;
  website?: string;
  infoPageUrl?: string;
}

export interface PlaceInfoFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: PlaceInfoProperties;
}

export interface DisruptionProperties {
  _id: string;
  originalId?: string;
  originalEquipmentInfoId?: string;
  originalPlaceInfoId?: string;
  category?: string; // 'elevator' | 'escalator'
  lastUpdate?: { $date: number };
  sourceId?: string;
  placeInfoId?: string;
  equipmentInfoId?: string;
}

export interface DisruptionFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: DisruptionProperties;
}

export interface EquipmentInfoProperties {
  _id: string;
  originalId?: string;
  category?: string; // 'elevator' | 'escalator'
  isWorking?: boolean;
  sourceId?: string;
  sourceImportId?: string;
  placeInfoId?: string;
  originalPlaceInfoId?: string;
}

export interface EquipmentInfoFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: EquipmentInfoProperties;
}

export interface FeatureCollection<F> {
  type: 'FeatureCollection';
  featureCount: number;
  totalFeatureCount?: number;
  related?: Record<string, Record<string, unknown>>;
  features: F[];
}

export interface Category {
  _id: string;
  icon?: string;
  parentIds?: string[];
  translations: { _id: Record<string, string> };
  synonyms?: string[];
}

export interface CategoriesResponse {
  count: number;
  totalCount: number;
  results: Category[];
}

export interface GlobalStatEntry {
  _id: string;
  name: string;
  date: { $date: number };
  value: number;
}

export interface GlobalStatsResponse {
  count: number;
  totalCount: number;
  results: GlobalStatEntry[];
}

export interface AccessibilityImage {
  _id: string;
  url: string;
  date: string;
  mimeType: string;
}

export interface ImagesResponse {
  totalCount: number;
  images: AccessibilityImage[];
}

export type WheelchairFilterPreset =
  | 'at-least-partially-accessible-by-wheelchair'
  | 'fully-accessible-by-wheelchair'
  | 'not-accessible-by-wheelchair'
  | 'unknown-wheelchair-accessibility';

/** Derives a simple traffic-light accessibility status from the raw accessibility object. */
export function wheelchairStatus(
  accessibility: AccessibilityInfo | undefined,
): 'full' | 'partial' | 'none' | 'unknown' {
  if (!accessibility) return 'unknown';
  if (accessibility.accessibleWith?.wheelchair === true) return 'full';
  if (
    accessibility.accessibleWith?.wheelchair === 'limited' ||
    accessibility.partiallyAccessibleWith?.wheelchair
  ) {
    return 'partial';
  }
  if (
    accessibility.accessibleWith?.wheelchair === false ||
    accessibility.notAccessibleWith?.wheelchair
  ) {
    return 'none';
  }
  return 'unknown';
}
