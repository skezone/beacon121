// ============================================================
// beacon121 - LADBS Adapter
// Fetches permits from LA Open Data (Socrata).
// Dataset: LADBS Soft Story Permits
// Resource: nc44-6znn
// ============================================================

import { fetchJSON } from '../core/fetcher.js';

const BASE = 'https://data.lacity.org/resource/nc44-6znn.json';

export class LADBSAdapter {
  constructor() {
    this.key = 'ladbs';
  }

  /**
   * Fetch a batch of permits from Socrata.
   * @param {number} limit - number of rows
   * @param {number} offset - pagination offset
   */
  async fetchBatch(limit = 100, offset = 0) {
    const url = `${BASE}?$limit=${limit}&$offset=${offset}`;
    return await fetchJSON(url);
  }

  /**
   * Transform a raw Socrata row into our permits table shape.
   */
  transform(row) {
    const apn = row.assessor_book && row.assessor_page && row.assessor_parcel
      ? `${row.assessor_book}-${row.assessor_page}-${row.assessor_parcel}`
      : null;

    return {
      permit_id:        row.pcis_permit || row.reference_old_permit || null,
      source_key:       this.key,
      apn:              apn,
      address:          row.address || null,
      permit_type:      row.permit_type || null,
      permit_subtype:   row.permit_sub_type || null,
      status:           row.latest_status || null,
      issued_date:      row.status_date || null,
      finalized_date:   null,
      valuation:        null,
      description:      row.permit_type || null,
      latitude:         row.latitude ? parseFloat(row.latitude) : null,
      longitude:        row.longitude ? parseFloat(row.longitude) : null,
    };
  }
}
