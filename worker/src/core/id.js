// ============================================================
// beacon121 - ID Generator
// Generates stable internal IDs for properties and listings.
// ============================================================

/**
 * Convert a string to a URL-safe lowercase token.
 * "123 Main St." -> "123-main-st"
 */
function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Simple deterministic hash (FNV-1a 32-bit).
 * Produces a short hex string, useful for stable IDs.
 */
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Generate a property ID from a normalized address.
 * Same address always produces the same property_id.
 */
export function makePropertyId(normalizedAddress) {
  const slug = slugify(normalizedAddress).slice(0, 40);
  return `p_${slug}_${hash(normalizedAddress)}`;
}

/**
 * Generate a listing ID from source and source_listing_id.
 * Same source + source id always produces the same listing_id.
 */
export function makeListingId(sourceKey, sourceListingId) {
  return `l_${sourceKey}_${hash(sourceKey + '::' + sourceListingId)}`;
}

/**
 * Generate a random short token. Used when no deterministic key exists.
 */
export function randomToken(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}