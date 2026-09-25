export async function listListings(env, limit = 50) {
  const { results } = await env.DB
    .prepare(`
      SELECT
        l.listing_id, l.source_key, l.status, l.price, l.listed_at,
        p.property_id, p.apn, p.address_full, p.address_city, p.address_zip,
        p.beds, p.baths, p.sqft, p.lot_sqft
      FROM listings l
      JOIN properties p ON p.property_id = l.property_id
      ORDER BY l.created_at DESC
      LIMIT ?
    `)
    .bind(limit)
    .all();

  for (const row of results) {
    if (!row.apn) { row.permits = []; row.permit_count = 0; continue; }
    const { results: permits } = await env.DB
      .prepare(`SELECT permit_id, permit_type, status, issued_date FROM permits WHERE apn = ? ORDER BY issued_date DESC LIMIT 20`)
      .bind(row.apn)
      .all();
    row.permits = permits;
    row.permit_count = permits.length;
  }

  return { ok: true, count: results.length, listings: results };
}
