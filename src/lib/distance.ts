// Distance calculation and external map handoff helpers.
//
// Accessibility Cloud has no routing/directions API at all — it's a places
// database, not a navigation engine. Rather than pretend otherwise, this
// gives users a real, honest bridge: an accurate straight-line distance for
// planning, and a one-tap handoff to Google/Apple Maps for actual turn-by-turn
// walking directions.

export function haversineDistanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Rough walking-time estimate at a slower, wheelchair-friendly pace (~4 km/h vs. the usual 5 km/h estimate). */
export function estimateWalkMinutes(meters: number): number {
  const metersPerMinute = 4000 / 60;
  return Math.max(1, Math.round(meters / metersPerMinute));
}

/**
 * Builds a URL that opens walking directions in the user's default maps app.
 * Uses the generic Google Maps directions URL, which works cross-platform
 * (opens the Google Maps app on mobile if installed, or the web app
 * otherwise) and lets the OS suggest Apple Maps as an alternative on iOS.
 */
export function walkingDirectionsUrl(
  destination: { lat: number; lng: number },
  origin?: { lat: number; lng: number },
): string {
  const dest = `${destination.lat},${destination.lng}`;
  const params = new URLSearchParams({
    api: '1',
    destination: dest,
    travelmode: 'walking',
  });
  if (origin) {
    params.set('origin', `${origin.lat},${origin.lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
