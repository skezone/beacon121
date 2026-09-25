// ============================================================
// beacon121 - Deduplicator
// Detects and merges duplicate listings from the same source.
// ============================================================

/**
 * Check if a listing already exists in the database.
 * A listing is considered the same if source_key + source_listing_id match.
 */
export async function findExistingListing(env, sourceKey, sourceListingId) {
  return await env.DB
    .prepare('SELECT listing_id, property_id FROM listings WHERE source_key = ? AND source_listing_id = ?')
    .bind(sourceKey, sourceListingId)
    .first();
}

/**
 * Check if a property already exists by normalized address.
 * If yes, returns the existing property_id. If no, returns null.
 */
export async function findExistingProperty(env, normalizedAddress) {
  return await env.DB
    .prepare('SELECT property_id FROM properties WHERE address_full = ? LIMIT 1')
    .bind(normalizedAddress)
    .first();
}