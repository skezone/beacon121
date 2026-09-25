// ============================================================
// beacon121 - Listings Routes
// Handles creation and reading of listings.
// ============================================================

import { ManualAdapter } from '../adapters/manual.js';
import { normalizeListing } from '../core/normalizer.js';
import { makePropertyId, makeListingId } from '../core/id.js';
import { findExistingListing, findExistingProperty } from '../core/deduplicator.js';
import { insertProperty, insertListing, logListingEvent } from '../core/db.js';

/**
 * POST /api/listings/manual
 * Body: JSON with at least { address_full, source_listing_id }
 */
export async function createManualListing(env, body) {
  const adapter = new ManualAdapter();
  const raw = await adapter.fetchOne(body);
  const n = normalizeListing(raw);

  // Deduplication: same source + source_listing_id => already exists
  const existingListing = await findExistingListing(env, n.source_key, n.source_listing_id);
  if (existingListing) {
    return {
      ok: true,
      created: false,
      reason: 'listing already exists',
      listing_id: existingListing.listing_id,
      property_id: existingListing.property_id,
    };
  }

  // Deduplication: same normalized address => reuse property
  const existingProperty = await findExistingProperty(env, n.address_full);
  let propertyId;
  let propertyCreated = false;

  if (existingProperty) {
    propertyId = existingProperty.property_id;
  } else {
    propertyId = makePropertyId(n.address_full);
    await insertProperty(env, {
      property_id: propertyId,
      address_full: n.address_full,
      address_street: n.address_street,
      address_city: n.address_city,
      address_zip: n.address_zip,
      latitude: n.latitude,
      longitude: n.longitude,
      property_type: n.property_type,
      beds: n.beds,
      baths: n.baths,
      sqft: n.sqft,
      lot_sqft: n.lot_sqft,
      year_built: n.year_built,
    });
    propertyCreated = true;
  }

  // Create listing
  const listingId = makeListingId(n.source_key, n.source_listing_id);
  await insertListing(env, {
    listing_id: listingId,
    property_id: propertyId,
    source_key: n.source_key,
    source_listing_id: n.source_listing_id,
    listing_url: n.listing_url,
    status: n.status,
    price: n.price,
    listed_at: n.listed_at,
    last_seen_at: n.last_seen_at,
  });

  await logListingEvent(env, listingId, 'CREATED', null, n.status);

  return {
    ok: true,
    created: true,
    property_created: propertyCreated,
    property_id: propertyId,
    listing_id: listingId,
  };
}

/**
 * GET /api/listings
 * Returns the most recent listings with basic property info.
 */
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
