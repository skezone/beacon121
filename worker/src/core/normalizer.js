// ============================================================
// beacon121 - Normalizer
// Converts raw input from any adapter into a standard shape.
// ============================================================

/**
 * Normalize a free-form address string.
 * Trims, collapses whitespace, title-cases basic street types.
 */
export function normalizeAddress(raw) {
  if (!raw) return '';
  return String(raw)
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .replace(/\bST\b\.?/g, 'ST')
    .replace(/\bAVE\b\.?/g, 'AVE')
    .replace(/\bBLVD\b\.?/g, 'BLVD')
    .replace(/\bDR\b\.?/g, 'DR')
    .replace(/\bRD\b\.?/g, 'RD');
}

/**
 * Normalize a numeric input. Returns null when not a number.
 */
export function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Normalize a price. Removes $ and commas.
 */
export function normalizePrice(value) {
  if (value === null || value === undefined || value === '') return null;
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/**
 * Normalize a ZIP code. Keeps the first 5 digits.
 */
export function normalizeZip(value) {
  if (!value) return null;
  const digits = String(value).replace(/[^0-9]/g, '');
  return digits.length >= 5 ? digits.slice(0, 5) : null;
}

/**
 * Normalize a date. Returns ISO string or null.
 */
export function normalizeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Normalize an entire listing object coming from any adapter.
 * Every adapter MUST return this shape.
 */
export function normalizeListing(raw) {
  return {
    source_key:         String(raw.source_key || '').toLowerCase(),
    source_listing_id:  String(raw.source_listing_id || ''),
    listing_url:        raw.listing_url || null,
    status:             String(raw.status || 'ACTIVE').toUpperCase(),
    price:              normalizePrice(raw.price),
    address_full:       normalizeAddress(raw.address_full),
    address_street:     raw.address_street || null,
    address_city:       raw.address_city || null,
    address_zip:        normalizeZip(raw.address_zip),
    latitude:           normalizeNumber(raw.latitude),
    longitude:          normalizeNumber(raw.longitude),
    property_type:      raw.property_type || null,
    beds:               normalizeNumber(raw.beds),
    baths:              normalizeNumber(raw.baths),
    sqft:               normalizeNumber(raw.sqft),
    lot_sqft:           normalizeNumber(raw.lot_sqft),
    year_built:         normalizeNumber(raw.year_built),
    listed_at:          normalizeDate(raw.listed_at) || new Date().toISOString(),
    last_seen_at:       new Date().toISOString(),
  };
}