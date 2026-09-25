// ============================================================
// beacon121 - Opportunity Score Engine
// Version: 0.2.0
// All sub-scores are 0-100, weighted into a total score.
// AI never computes these numbers. Rules do.
// ============================================================

const WEIGHTS = {
  price: 20,
  adu: 20,
  rental: 15,
  renovation: 10,
  neighborhood: 10,
  comparable: 10,
  permit: 5,
  risk: 10,
};

/**
 * Price score: lower price per sqft relative to area median => higher score.
 * For phase 6, we approximate with absolute price bands.
 */
function priceScore(price) {
  if (!price) return 50;
  if (price < 500000) return 90;
  if (price < 700000) return 75;
  if (price < 900000) return 60;
  if (price < 1200000) return 45;
  return 30;
}

/**
 * ADU score: based on lot size, footprint, and zoning.
 * Zoning matters most:
 *   Residential zones (R1, R2, R3, RD, RE) allow ADU by right.
 *   Commercial zones (C1, C2, C4) are restricted.
 *   Manufacturing (M, CM) usually not allowed.
 * When zoning is unknown, fall back to lot ratio only.
 */
function aduScore(lotSqft, sqft, zoning, category) {
  const cat = (category || '').toLowerCase();
  const zone = (zoning || '').toUpperCase();

  // Zoning gate: reject non-residential categories outright.
  const isResidential =
    cat.includes('residential') ||
    /^(R|RD|RE|RS|RW)/.test(zone) ||
    /\[Q\]R/.test(zone);

  const isCommercial =
    cat.includes('commercial') || /^(C|CR|CW)/.test(zone);

  const isManufacturing =
    cat.includes('manufacturing') || /^(M|CM|MR)/.test(zone);

  // Lot ratio fallback (used inside residential only)
  let ratioScore = 50;
  if (lotSqft && sqft) {
    const ratio = lotSqft / sqft;
    if (ratio > 5) ratioScore = 95;
    else if (ratio > 4) ratioScore = 80;
    else if (ratio > 3) ratioScore = 65;
    else if (ratio > 2) ratioScore = 50;
    else ratioScore = 30;
  } else if (lotSqft) {
    ratioScore = 60;
  }

  if (isManufacturing) return 10;
  if (isCommercial) return 25;
  if (isResidential) return ratioScore;
  // Unknown zoning: neutral, but note uncertainty in inputs_json later.
  return Math.round(ratioScore * 0.7);
}

/**
 * Rental score: based on price to rent ratio approximation.
 * Placeholder until rental data is wired in.
 */
function rentalScore(price) {
  if (!price) return 50;
  if (price < 600000) return 85;
  if (price < 900000) return 70;
  if (price < 1200000) return 55;
  return 40;
}

/**
 * Renovation score: older houses usually need more work,
 * but also offer more upside if priced right.
 */
function renovationScore(yearBuilt) {
  if (!yearBuilt) return 50;
  const age = new Date().getFullYear() - yearBuilt;
  if (age > 70) return 90;
  if (age > 50) return 75;
  if (age > 30) return 60;
  if (age > 15) return 45;
  return 30;
}

/**
 * Permit score: count of recent permits on the same APN.
 * More activity => more signals.
 */
function permitScore(permitCount) {
  if (permitCount === 0) return 30;
  if (permitCount === 1) return 55;
  if (permitCount <= 3) return 75;
  if (permitCount <= 6) return 90;
  return 95;
}

/**
 * Neighborhood score placeholder.
 * Will use Census/ACS once wired.
 */
function neighborhoodScore() {
  return 60;
}

/**
 * Comparable score placeholder.
 * Will use real comps once we have more listings.
 */
function comparableScore() {
  return 60;
}

/**
 * Risk score: higher is safer.
 * Placeholder until flood/fire layers are wired.
 */
function riskScore() {
  return 70;
}

export function computeScore(property, permitCount, zoningInfo) {
  const zoning = zoningInfo?.zoning ?? null;
  const category = zoningInfo?.category ?? null;

  const price = priceScore(property.price);
  const adu = aduScore(property.lot_sqft, property.sqft, zoning, category);
  const rental = rentalScore(property.price);
  const renovation = renovationScore(property.year_built);
  const permit = permitScore(permitCount);
  const neighborhood = neighborhoodScore();
  const comparable = comparableScore();
  const risk = riskScore();

  const total =
    (price * WEIGHTS.price +
     adu * WEIGHTS.adu +
     rental * WEIGHTS.rental +
     renovation * WEIGHTS.renovation +
     permit * WEIGHTS.permit +
     neighborhood * WEIGHTS.neighborhood +
     comparable * WEIGHTS.comparable +
     risk * WEIGHTS.risk) / 100;

  return {
    score_version: 'v0.2',
    total_score: Math.round(total),
    price_score: price,
    adu_score: adu,
    rental_score: rental,
    renovation_score: renovation,
    permit_score: permit,
    neighborhood_score: neighborhood,
    comparable_score: comparable,
    risk_score: risk,
    inputs_json: JSON.stringify({ property, permitCount, zoningInfo }),
  };
}
