// ============================================================
// beacon121 - Flood Adapter
// Fetches FEMA flood zone from LA County SMMAR service.
// Service: arcgis.gis.lacounty.gov/DRP/SMMAR/MapServer/21
// ============================================================

import { fetchJSON } from '../core/fetcher.js';

const BASE = 'https://arcgis.gis.lacounty.gov/arcgis/rest/services/DRP/SMMAR/MapServer/21/query';

export class FloodAdapter {
  constructor() {
    this.key = 'lacounty-flood';
  }

  /**
   * Query flood zone for a single point.
   * Returns { flood_zone, flood_type } or null when not found.
   */
  async fetchOne(latitude, longitude) {
    if (!latitude || !longitude) return null;

    const geometry = JSON.stringify({
      x: longitude,
      y: latitude,
      spatialReference: { wkid: 4326 },
    });

    const url =
      `${BASE}?geometry=${encodeURIComponent(geometry)}` +
      `&geometryType=esriGeometryPoint` +
      `&inSR=4326` +
      `&spatialRel=esriSpatialRelIntersects` +
      `&outFields=TYPE,FLD_ZONE` +
      `&returnGeometry=false` +
      `&f=json`;

    const data = await fetchJSON(url, { timeoutMs: 15000 });
    const feat = data?.features?.[0]?.attributes;
    if (!feat) return null;

    return {
      flood_zone: feat.FLD_ZONE ?? null,
      flood_type: feat.TYPE ?? null,
    };
  }
}
