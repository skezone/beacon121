-- ============================================================
-- beacon121 - D1 Schema
-- Version: 1.3.0
-- Source of truth: docs/data-model.md
-- ============================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- Entity 7: Source
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sources (
  source_key    TEXT PRIMARY KEY,
  source_type   TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  base_url      TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sources_type ON sources(source_type);

-- ------------------------------------------------------------
-- Entity 1: Property
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS properties (
  property_id     TEXT PRIMARY KEY,
  apn             TEXT,
  address_full    TEXT,
  address_street  TEXT,
  address_city    TEXT,
  address_zip     TEXT,
  latitude        REAL,
  longitude       REAL,
  property_type   TEXT,
  beds            INTEGER,
  baths           REAL,
  sqft            INTEGER,
  lot_sqft        INTEGER,
  year_built      INTEGER,
  zoning_code     TEXT,
  zoning_category TEXT,
  flood_zone      TEXT,
  flood_type      TEXT,
  fire_hazard_class TEXT,
  fire_sra        TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_properties_apn        ON properties(apn);
CREATE INDEX IF NOT EXISTS idx_properties_zip        ON properties(address_zip);
CREATE INDEX IF NOT EXISTS idx_properties_city       ON properties(address_city);
CREATE INDEX IF NOT EXISTS idx_properties_geo        ON properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_updated_at ON properties(updated_at);

-- ------------------------------------------------------------
-- Entity 2: Listing
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listings (
  listing_id         TEXT PRIMARY KEY,
  property_id        TEXT NOT NULL,
  source_key         TEXT NOT NULL,
  source_listing_id  TEXT NOT NULL,
  listing_url        TEXT,
  status             TEXT NOT NULL,
  price              INTEGER,
  listed_at          TEXT,
  last_seen_at       TEXT,
  price_changed_at   TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
  FOREIGN KEY (source_key)  REFERENCES sources(source_key),
  UNIQUE(source_key, source_listing_id)
);

CREATE INDEX IF NOT EXISTS idx_listings_property   ON listings(property_id);
CREATE INDEX IF NOT EXISTS idx_listings_status     ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_source     ON listings(source_key);
CREATE INDEX IF NOT EXISTS idx_listings_price      ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_listed_at  ON listings(listed_at);
CREATE INDEX IF NOT EXISTS idx_listings_updated_at ON listings(updated_at);

-- ------------------------------------------------------------
-- Entity 3: ListingHistory (append-only)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listing_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id   TEXT NOT NULL,
  event_type   TEXT NOT NULL,
  old_value    TEXT,
  new_value    TEXT,
  observed_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lh_listing  ON listing_history(listing_id);
CREATE INDEX IF NOT EXISTS idx_lh_event    ON listing_history(event_type);
CREATE INDEX IF NOT EXISTS idx_lh_observed ON listing_history(observed_at);

-- ------------------------------------------------------------
-- Entity 4: Permit
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permits (
  permit_id       TEXT PRIMARY KEY,
  source_key      TEXT NOT NULL,
  apn             TEXT,
  address         TEXT,
  permit_type     TEXT,
  permit_subtype  TEXT,
  status          TEXT,
  issued_date     TEXT,
  finalized_date  TEXT,
  valuation       INTEGER,
  description     TEXT,
  latitude        REAL,
  longitude       REAL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_key) REFERENCES sources(source_key)
);

CREATE INDEX IF NOT EXISTS idx_permits_apn      ON permits(apn);
CREATE INDEX IF NOT EXISTS idx_permits_type     ON permits(permit_type);
CREATE INDEX IF NOT EXISTS idx_permits_issued   ON permits(issued_date);
CREATE INDEX IF NOT EXISTS idx_permits_geo      ON permits(latitude, longitude);

-- ------------------------------------------------------------
-- Entity 5: Score
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scores (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id        TEXT NOT NULL,
  score_version      TEXT NOT NULL,
  total_score        INTEGER NOT NULL,
  price_score        INTEGER,
  adu_score          INTEGER,
  rental_score       INTEGER,
  renovation_score   INTEGER,
  neighborhood_score INTEGER,
  comparable_score   INTEGER,
  permit_score       INTEGER,
  risk_score         INTEGER,
  computed_at        TEXT NOT NULL DEFAULT (datetime('now')),
  inputs_json        TEXT,
  FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scores_property   ON scores(property_id);
CREATE INDEX IF NOT EXISTS idx_scores_total      ON scores(total_score);
CREATE INDEX IF NOT EXISTS idx_scores_computed   ON scores(computed_at);
CREATE INDEX IF NOT EXISTS idx_scores_version    ON scores(score_version);

-- ------------------------------------------------------------
-- Entity 6: Job
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT NOT NULL,
  payload_json  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  attempts      INTEGER NOT NULL DEFAULT 0,
  last_error    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_status   ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type     ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_created  ON jobs(created_at);

-- ------------------------------------------------------------
-- Seed: core sources
-- ------------------------------------------------------------
INSERT OR IGNORE INTO sources (source_key, source_type, display_name, base_url, notes)
VALUES
  ('manual',    'listing',     'Manual Entry',      NULL,                                     'User-provided listings'),
  ('zillow',    'listing',     'Zillow',            'https://www.zillow.com',                 'Subject to ToS - pluggable adapter'),
  ('redfin',    'listing',     'Redfin',            'https://www.redfin.com',                 'Subject to ToS - pluggable adapter'),
  ('realtor',   'listing',     'Realtor.com',       'https://www.realtor.com',                'Subject to ToS - pluggable adapter'),
  ('crmls',     'listing',     'CRMLS',             'https://www.crmls.org',                  'Licensed MLS - future'),
  ('ladbs',     'permit',      'LA Dept. of Building & Safety', 'https://data.lacity.org',     'Via Socrata'),
  ('lacity',    'permit',      'City of LA Open Data', 'https://data.lacity.org',              'General LA Open Data'),
  ('census',    'demographic', 'US Census / ACS',   'https://api.census.gov',                 'Free API'),
  ('osm',       'geo',         'OpenStreetMap',     'https://www.openstreetmap.org',          'Map data');
