// ============================================================
// beacon121 - Database Helpers
// Small wrappers around D1 statements used across the project.
// ============================================================

/**
 * Insert a new property. Returns the property_id.
 */
export async function insertProperty(env, property) {
  await env.DB
    .prepare(`
      INSERT INTO properties (
        property_id, apn, address_full, address_street, address_city, address_zip,
        latitude, longitude, property_type, beds, baths, sqft, lot_sqft, year_built
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      property.property_id,
      property.apn ?? null,
      property.address_full,
      property.address_street ?? null,
      property.address_city ?? null,
      property.address_zip ?? null,
      property.latitude ?? null,
      property.longitude ?? null,
      property.property_type ?? null,
      property.beds ?? null,
      property.baths ?? null,
      property.sqft ?? null,
      property.lot_sqft ?? null,
      property.year_built ?? null,
    )
    .run();
}

/**
 * Insert a new listing. Returns nothing.
 */
export async function insertListing(env, listing) {
  await env.DB
    .prepare(`
      INSERT INTO listings (
        listing_id, property_id, source_key, source_listing_id, listing_url,
        status, price, listed_at, last_seen_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      listing.listing_id,
      listing.property_id,
      listing.source_key,
      listing.source_listing_id,
      listing.listing_url ?? null,
      listing.status,
      listing.price ?? null,
      listing.listed_at,
      listing.last_seen_at,
    )
    .run();
}

/**
 * Log an event in listing_history.
 */
export async function logListingEvent(env, listingId, eventType, oldValue, newValue) {
  await env.DB
    .prepare('INSERT INTO listing_history (listing_id, event_type, old_value, new_value) VALUES (?, ?, ?, ?)')
    .bind(listingId, eventType, oldValue ?? null, newValue ?? null)
    .run();
}