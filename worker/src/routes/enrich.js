// ============================================================
// beacon121 - Enrich Routes
// Fetches zoning for all properties with lat/lon and stores it.
// ============================================================

import { ZoningAdapter } from '../adapters/zoning.js';

/**
 * POST /api/enrich/zoning
 * For every property with lat/lon and no zoning_code, fetch zoning
 * from LA ArcGIS and store it in properties.
 */
export async function enrichZoning(env) {
  const { results: rows } = await env.DB
    .prepare(`
      SELECT property_id, latitude, longitude
      FROM properties
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND zoning_code IS NULL
    `)
    .all();

  const adapter = new ZoningAdapter();
  let updated = 0;
  let skipped = 0;
  const results = [];

  for (const row of rows) {
    let info = null;
    try {
      info = await adapter.fetchOne(row.latitude, row.longitude);
    } catch (e) {
      results.push({ property_id: row.property_id, error: e.message });
      skipped++;
      continue;
    }

    if (!info) {
      results.push({ property_id: row.property_id, zoning: null });
      skipped++;
      continue;
    }

    await env.DB
      .prepare('UPDATE properties SET zoning_code = ?, zoning_category = ?, updated_at = datetime(\'now\') WHERE property_id = ?')
      .bind(info.zoning, info.category, row.property_id)
      .run();

    results.push({
      property_id: row.property_id,
      zoning_code: info.zoning,
      zoning_category: info.category,
    });
    updated++;
  }

  return { ok: true, updated, skipped, results };
}
