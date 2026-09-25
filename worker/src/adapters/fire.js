// ============================================================
// beacon121 - Fire Adapter
// Fetches CAL FIRE Fire Hazard Severity Zone for a point.
// Service: services8.arcgis.com/dRbkL75uGyx40MXP/FHSZLRA25_Phase4_v1
// Layer:   1 (California Fire Hazard Severity Zones)
// Note: This FeatureServer does not support point queries,
//       so we use a small envelope around the point.
// ============================================================

import { fetchJSON } from '../core/fetcher.js';

const BASE = 'https://services8.arcgis.com/dRbkL75uGyx40MXP/arcgis/rest/services/FHSZLRA25_Phase4_v1/FeatureServer/1/query';

// Envelope half-size in degrees. 0.001 deg is roughly 100 meters.
const HALF = 0.001;

export class FireAdapter {
  constructor() {
    this.key = 'calfire-fhsz';
  }

  /**
   * Query fire hazard severity zone for a single point.
   * Returns { hazard_class, sra } or null when not found.
   */
  async fetchOne(latitude, longitude) {
    if (!latitude || !longitude) return null;

    const envelope = JSON.stringify({
      xmin: longitude - HALF,
      ymin: latitude - HALF,
      xmax: longitude + HALF,
      ymax: latitude + HALF,
      spatialReference: { wkid: 4326 },
    });

    const url =
      `${BASE}?geometry=${encodeURIComponent(envelope)}` +
      `&geometryType=esriGeometryEnvelope` +
      `&inSR=4326` +
      `&spatialRel=esriSpatialRelIntersects` +
      `&outFields=HAZ_CLASS,SRA` +
      `&returnGeometry=false` +
      `&f=json`;

    const data = await fetchJSON(url, { timeoutMs: 15000 });
    const feat = data?.features?.[0]?.attributes;
    if (!feat) return null;

    return {
      hazard_class: feat.HAZ_CLASS ?? null,
      sra: feat.SRA ?? null,
    };
  }
}
