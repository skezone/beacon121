// ============================================================
// beacon121 - Fire Adapter
// Fetches CAL FIRE Fire Hazard Severity Zone for a point.
// Service: services1.arcgis.com/P5Mv5GY5S66M8Z1Q
// Layer:   Fire_Hazard_Severity/FeatureServer/0
// Dataset: CA_FRAP_BND_FIRE_HAZARD_SEVERITY_ZONE
// Note:    If the point is not inside any FHSZ, returns null.
//          This is normal for urban areas like LA City.
// ============================================================

import { fetchJSON } from '../core/fetcher.js';

const BASE = 'https://services1.arcgis.com/P5Mv5GY5S66M8Z1Q/ArcGIS/rest/services/Fire_Hazard_Severity/FeatureServer/0/query';

export class FireAdapter {
  constructor() {
    this.key = 'calfire-fhsz';
  }

  /**
   * Query fire hazard severity zone for a single point.
   * Returns { hazard_class, hazard_code, sra } or null when not found.
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
      `&outFields=HAZ_CLASS,HAZ_CODE,SRA` +
      `&returnGeometry=false` +
      `&f=json`;

    const data = await fetchJSON(url, { timeoutMs: 15000 });
    const feat = data?.features?.[0]?.attributes;
    if (!feat) return null;

    return {
      hazard_class: feat.HAZ_CLASS ?? null,
      hazard_code: feat.HAZ_CODE ?? null,
      sra: feat.SRA ?? null,
    };
  }
}
