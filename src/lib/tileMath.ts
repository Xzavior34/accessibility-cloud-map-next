// Slippy map tile math (Web Mercator), used because accessibility.cloud's
// /place-infos endpoint recommends x/y/z tile-based queries over radius
// search for map-browsing use cases (cacheable, bounded result sets).
// See: https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames

export interface TileCoord {
  x: number;
  y: number;
  z: number;
}

export function lonLatToTile(lon: number, lat: number, zoom: number): TileCoord {
  const latRad = (lat * Math.PI) / 180;
  const n = 2 ** zoom;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y, z: zoom };
}

/** Returns every tile that covers the given bounding box at the given zoom. */
export function tilesForBounds(
  bounds: { west: number; south: number; east: number; north: number },
  zoom: number,
): TileCoord[] {
  const zoomInt = Math.round(zoom);
  const nw = lonLatToTile(bounds.west, bounds.north, zoomInt);
  const se = lonLatToTile(bounds.east, bounds.south, zoomInt);

  const tiles: TileCoord[] = [];
  const maxTile = 2 ** zoomInt - 1;
  for (let x = Math.max(0, nw.x); x <= Math.min(maxTile, se.x); x++) {
    for (let y = Math.max(0, nw.y); y <= Math.min(maxTile, se.y); y++) {
      tiles.push({ x, y, z: zoomInt });
    }
  }
  return tiles;
}

/** Picks a tile zoom level appropriate for the current map zoom, capped to keep tile counts sane. */
export function tileZoomForMapZoom(mapZoom: number): number {
  // Clamp to a reasonable range: too low = huge tiles (slow/huge responses),
  // too high = too many tiles to request per viewport.
  return Math.min(17, Math.max(14, Math.round(mapZoom)));
}

export function tileKey(t: TileCoord): string {
  return `${t.z}/${t.x}/${t.y}`;
}
