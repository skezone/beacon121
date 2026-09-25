// ============================================================
// beacon121 - Risk Score Calculator
// Combines Flood and Fire data into a single 0-100 score.
// Higher is safer.
// ============================================================

/**
 * Flood penalty. Zone X and shaded X are safe. Higher zones = higher penalty.
 */
function floodPenalty(floodZone) {
  if (!floodZone) return 0;
  const z = String(floodZone).toUpperCase();
  if (z === 'X') return 0;
  if (z === 'D') return 20;
  if (z === 'B' || z === '0.2 PCT ANNUAL CHANCE FLOOD HAZARD') return 20;
  if (z === 'C') return 15;
  if (z === 'A' || z === 'AE' || z === 'AO' || z === 'AH') return 40;
  if (z === 'V' || z === 'VE') return 50;
  return 10;
}

/**
 * Fire penalty. NonWildland is safe. Higher classes = higher penalty.
 */
function firePenalty(hazardClass) {
  if (!hazardClass) return 0;
  const h = String(hazardClass).toUpperCase();
  if (h.includes('NON') || h.includes('NONE')) return 0;
  if (h === 'MODERATE') return 10;
  if (h === 'HIGH') return 25;
  if (h === 'VERY HIGH') return 40;
  return 5;
}

export function calculateRiskScore(floodInfo, fireInfo) {
  const floodZone = floodInfo?.flood_zone ?? null;
  const hazardClass = fireInfo?.hazard_class ?? null;

  const fp = floodPenalty(floodZone);
  const xp = firePenalty(hazardClass);

  const score = Math.max(0, Math.min(100, 100 - fp - xp));

  const reasons = [];

  if (floodZone === null) {
    reasons.push('Flood data not available');
  } else if (fp === 0) {
    reasons.push('Outside FEMA flood zone');
  } else {
    reasons.push(`Inside FEMA flood zone ${floodZone}`);
  }

  if (hazardClass === null) {
    reasons.push('Outside CAL FIRE hazard zone');
  } else if (xp === 0) {
    reasons.push('Outside CAL FIRE hazard zone');
  } else {
    reasons.push(`Inside CAL FIRE ${hazardClass} zone`);
  }

  return {
    score,
    flood: floodZone,
    fire: hazardClass,
    reasons,
  };
}
