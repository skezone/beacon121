// ============================================================
// beacon121 - Zoning Adapter
// Fetches zoning for a lat/lon from LA ArcGIS Zoning service.
// Service: services5.arcgis.com/7nsPwEMP38bSkCjy
// Layer:   Zoning/FeatureServer/15
// ============================================================

import { fetchJSON } from '../core/fetcher.js';

const BASE = 'https://services5.arcgis.com/7nsPwEMP38bSkCjy/ArcGIS/rest/services/Zoning/FeatureServer/15/query';

export class ZoningAdapter {
  constructor() {
    this.key = 'lacity-zoning';
  }

  /**
   * Query zoning for a single point.
   * Returns { zoning, category } or null when not found.
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
      `&outFields=Zoning,CATEGORY` +
      `&returnGeometry=false` +
      `&f=json`;

    const data = await fetchJSON(url, { timeoutMs: 15000 });
    const feat = data?.features?.[0]?.attributes;
    if (!feat) return null;

    return {
      zoning:   feat.Zoning ?? null,
      category: feat.CATEGORY ?? null,
    };
  }
}
