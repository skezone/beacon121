// ============================================================
// beacon121 - Enrich Routes
// Fetches zoning, flood, and fire for properties and stores them.
// ============================================================

import { ZoningAdapter } from '../adapters/zoning.js';
import { FloodAdapter } from '../adapters/flood.js';
import { FireAdapter } from '../adapters/fire.js';

/**
 * POST /api/enrich/zoning
 * Fetches zoning for properties without zoning_code.
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

/**
 * POST /api/enrich/flood
 * Fetches flood zone for properties without flood_zone.
 */
export async function enrichFlood(env) {
  const { results: rows } = await env.DB
    .prepare(`
      SELECT property_id, latitude, longitude
      FROM properties
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND flood_zone IS NULL
    `)
    .all();

  const adapter = new FloodAdapter();
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
      results.push({ property_id: row.property_id, flood: null });
      skipped++;
      continue;
    }

    await env.DB
      .prepare('UPDATE properties SET flood_zone = ?, flood_type = ?, updated_at = datetime(\'now\') WHERE property_id = ?')
      .bind(info.flood_zone, info.flood_type, row.property_id)
      .run();

    results.push({
      property_id: row.property_id,
      flood_zone: info.flood_zone,
      flood_type: info.flood_type,
    });
    updated++;
  }

  return { ok: true, updated, skipped, results };
}

/**
 * POST /api/enrich/fire
 * Fetches CAL FIRE hazard class for properties without fire_hazard_class.
 */
export async function enrichFire(env) {
  const { results: rows } = await env.DB
    .prepare(`
      SELECT property_id, latitude, longitude
      FROM properties
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND fire_hazard_class IS NULL
    `)
    .all();

  const adapter = new FireAdapter();
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
      results.push({ property_id: row.property_id, fire: null });
      skipped++;
      continue;
    }

    await env.DB
      .prepare('UPDATE properties SET fire_hazard_class = ?, fire_sra = ?, updated_at = datetime(\'now\') WHERE property_id = ?')
      .bind(info.hazard_class, info.sra, row.property_id)
      .run();

    results.push({
      property_id: row.property_id,
      fire_hazard_class: info.hazard_class,
      fire_sra: info.sra,
    });
    updated++;
  }

  return { ok: true, updated, skipped, results };
}
