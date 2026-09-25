// ============================================================
// beacon121 - LADBS Adapter
// Fetches building permits from LA Open Data (Socrata).
// Dataset: Building Permits Issued from 2020 to Present
// Resource: pi9x-tg5x
// ============================================================

import { fetchJSON } from '../core/fetcher.js';

const BASE = 'https://data.lacity.org/resource/pi9x-tg5x.json';

export class LADBSAdapter {
  constructor() {
    this.key = 'ladbs';
  }

  async fetchBatch(limit = 100, offset = 0) {
    const url = `${BASE}?$limit=${limit}&$offset=${offset}&$order=issue_date DESC`;
    return await fetchJSON(url, { timeoutMs: 20000 });
  }

  transform(row) {
    return {
      permit_id:      row.permit_nbr || null,
      source_key:     this.key,
      apn:            row.apn || null,
      address:        row.primary_address
                        ? `${row.primary_address}${row.zip_code ? ', ' + row.zip_code : ''}`
                        : null,
      permit_type:    row.permit_type || null,
      permit_subtype: row.permit_sub_type || null,
      status:         row.status_desc || null,
      issued_date:    row.issue_date || null,
      finalized_date: row.status_date || null,
      valuation:      row.valuation ? parseInt(row.valuation, 10) : null,
      description:    row.work_desc || null,
      latitude:       row.lat ? parseFloat(row.lat) : null,
      longitude:      row.lon ? parseFloat(row.lon) : null,
    };
  }
}
