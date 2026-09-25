// ============================================================
// beacon121 - Opportunity Score Engine
// Version: 0.3.0
// All sub-scores are 0-100, weighted into a total score.
// AI never computes these numbers. Rules do.
// ============================================================

import { calculateRiskScore } from './risk.js';

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

function priceScore(price) {
  if (!price) return 50;
  if (price < 500000) return 90;
  if (price < 700000) return 75;
  if (price < 900000) return 60;
  if (price < 1200000) return 45;
  return 30;
}

function aduScore(lotSqft, sqft, zoning, category) {
  const cat = (category || '').toLowerCase();
  const zone = (zoning || '').toUpperCase();

  const isResidential =
    cat.includes('residential') ||
    /^(R|RD|RE|RS|RW)/.test(zone) ||
    /\[Q\]R/.test(zone);

  const isCommercial =
    cat.includes('commercial') || /^(C|CR|CW)/.test(zone);

  const isManufacturing =
    cat.includes('manufacturing') || /^(M|CM|MR)/.test(zone);

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
  return Math.round(ratioScore * 0.7);
}

function rentalScore(price) {
  if (!price) return 50;
  if (price < 600000) return 85;
  if (price < 900000) return 70;
  if (price < 1200000) return 55;
  return 40;
}

function renovationScore(yearBuilt) {
  if (!yearBuilt) return 50;
  const age = new Date().getFullYear() - yearBuilt;
  if (age > 70) return 90;
  if (age > 50) return 75;
  if (age > 30) return 60;
  if (age > 15) return 45;
  return 30;
}

function permitScore(permitCount) {
  if (permitCount === 0) return 30;
  if (permitCount === 1) return 55;
  if (permitCount <= 3) return 75;
  if (permitCount <= 6) return 90;
  return 95;
}

function neighborhoodScore() {
  return 60;
}

function comparableScore() {
  return 60;
}

export function computeScore(property, permitCount, context) {
  const zoningInfo = context?.zoningInfo ?? null;
  const floodInfo = context?.floodInfo ?? null;
  const fireInfo = context?.fireInfo ?? null;

  const zoning = zoningInfo?.zoning ?? null;
  const category = zoningInfo?.category ?? null;

  const price = priceScore(property.price);
  const adu = aduScore(property.lot_sqft, property.sqft, zoning, category);
  const rental = rentalScore(property.price);
  const renovation = renovationScore(property.year_built);
  const permit = permitScore(permitCount);
  const neighborhood = neighborhoodScore();
  const comparable = comparableScore();

  const riskResult = calculateRiskScore(floodInfo, fireInfo);
  const risk = riskResult.score;

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
    score_version: 'v0.3',
    total_score: Math.round(total),
    price_score: price,
    adu_score: adu,
    rental_score: rental,
    renovation_score: renovation,
    permit_score: permit,
    neighborhood_score: neighborhood,
    comparable_score: comparable,
    risk_score: risk,
    inputs_json: JSON.stringify({
      property,
      permitCount,
      zoningInfo,
      floodInfo,
      fireInfo,
      risk_reasons: riskResult.reasons,
    }),
  };
}
