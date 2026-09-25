// ============================================================
// beacon121 - Permits Routes
// Endpoints for fetching and listing permits.
// ============================================================

import { LADBSAdapter } from '../adapters/ladbs.js';

/**
 * POST /api/permits/sync
 * Fetch a batch from LADBS and store into D1.
 */
export async function syncPermits(env, limit = 50, offset = 0) {
  const adapter = new LADBSAdapter();
  const raw = await adapter.fetchBatch(limit, offset);

  let inserted = 0;
  let skipped = 0;

  for (const row of raw) {
    const p = adapter.transform(row);
    if (!p.permit_id) { skipped++; continue; }

    const exists = await env.DB
      .prepare('SELECT permit_id FROM permits WHERE permit_id = ?')
      .bind(p.permit_id)
      .first();

    if (exists) { skipped++; continue; }

    await env.DB
      .prepare(`
        INSERT INTO permits (
          permit_id, source_key, apn, address, permit_type, permit_subtype,
          status, issued_date, finalized_date, valuation, description, latitude, longitude
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        p.permit_id, p.source_key, p.apn, p.address, p.permit_type, p.permit_subtype,
        p.status, p.issued_date, p.finalized_date, p.valuation, p.description,
        p.latitude, p.longitude
      )
      .run();

    inserted++;
  }

  return { ok: true, fetched: raw.length, inserted, skipped };
}

/**
 * GET /api/permits
 * List permits from D1.
 */
export async function listPermits(env, limit = 50) {
  const { results } = await env.DB
    .prepare('SELECT permit_id, apn, address, permit_type, status, issued_date, latitude, longitude FROM permits ORDER BY issued_date DESC LIMIT ?')
    .bind(limit)
    .all();
  return { ok: true, count: results.length, permits: results };
}
