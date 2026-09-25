// ============================================================
// beacon121 - Opportunity Score Engine
// Version: 0.1.0
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
 * ADU score: based on lot size and existing footprint.
 * A large lot with a modest house is a strong ADU candidate.
 */
function aduScore(lotSqft, sqft) {
  if (!lotSqft) return 50;
  const ratio = sqft ? lotSqft / sqft : 4;
  if (ratio > 5) return 95;
  if (ratio > 4) return 80;
  if (ratio > 3) return 65;
  if (ratio > 2) return 50;
  return 30;
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

export function computeScore(property, permitCount) {
  const price = priceScore(property.price);
  const adu = aduScore(property.lot_sqft, property.sqft);
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
    score_version: 'v0.1',
    total_score: Math.round(total),
    price_score: price,
    adu_score: adu,
    rental_score: rental,
    renovation_score: renovation,
    permit_score: permit,
    neighborhood_score: neighborhood,
    comparable_score: comparable,
    risk_score: risk,
    inputs_json: JSON.stringify({ property, permitCount }),
  };
}
