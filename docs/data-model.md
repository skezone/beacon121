# beacon121 - Data Model

Version: 1.1.0
Phase: 0 (Design)
Status: LOCKED - v1.1.0 (zoning columns added)

---

## Core Principle

Data flows in one direction:

Listing Source → Listing → Property → Enrichment → Analysis → Score → Report

Property is the center of the system.
Listings come and go. Properties persist.

---

## Entity 1: Property

Represents the physical real estate asset. Does not change when listing changes.

[LOCKED] property_id        TEXT PRIMARY KEY  (internal, e.g. "p_8f3a2b")
[LOCKED] apn                TEXT              (Assessor Parcel Number, LA County)
[LOCKED] address_full       TEXT
[LOCKED] address_street     TEXT
[LOCKED] address_city       TEXT
[LOCKED] address_zip        TEXT
[LOCKED] latitude           REAL
[LOCKED] longitude          REAL
[LOCKED] property_type      TEXT              (SFR, condo, duplex, ...)
[LOCKED] beds               INTEGER
[LOCKED] baths              REAL
[LOCKED] sqft               INTEGER
[LOCKED] lot_sqft           INTEGER
[LOCKED] year_built         INTEGER
[LOCKED] zoning_code        TEXT              (e.g. "[Q]C2-1VL")
[LOCKED] zoning_category    TEXT              (e.g. "Commercial")
[LOCKED] created_at         TIMESTAMP
[LOCKED] updated_at         TIMESTAMP

Notes:
- property_id is internal and stable forever.
- apn links us to LA County parcel data (Socrata).
- latitude/longitude cached once, never re-geocoded.

---

## Entity 2: Listing

Represents one appearance of a property on the market.
A property can have many listings over time (relisted, relisted again, etc.)

[LOCKED] listing_id         TEXT PRIMARY KEY
[LOCKED] property_id        TEXT FK → Property
[LOCKED] source             TEXT              (zillow, redfin, mls, manual, ...)
[LOCKED] source_listing_id  TEXT              (id used by the source)
[LOCKED] listing_url        TEXT
[LOCKED] status             TEXT              (NEW, ACTIVE, PRICE_REDUCED, PENDING, SOLD, REMOVED)
[LOCKED] price              INTEGER
[LOCKED] listed_at          TIMESTAMP
[LOCKED] last_seen_at       TIMESTAMP
[LOCKED] price_changed_at   TIMESTAMP
[LOCKED] created_at         TIMESTAMP
[LOCKED] updated_at         TIMESTAMP

Notes:
- UNIQUE(source, source_listing_id) to prevent duplicates from same source.
- status changes are recorded in listing_history.

---

## Entity 3: ListingHistory

Append-only log of every change to a listing.

[LOCKED] id                 INTEGER PRIMARY KEY AUTOINCREMENT
[LOCKED] listing_id         TEXT FK → Listing
[LOCKED] event_type         TEXT              (STATUS_CHANGE, PRICE_CHANGE, SEEN)
[LOCKED] old_value          TEXT
[LOCKED] new_value          TEXT
[LOCKED] observed_at        TIMESTAMP

---

## Entity 4: Permit

Building permits from LA Open Data (Socrata).

[LOCKED] permit_id          TEXT PRIMARY KEY
[LOCKED] source             TEXT              (ladbs, ...)
[LOCKED] apn                TEXT
[LOCKED] address            TEXT
[LOCKED] permit_type        TEXT
[LOCKED] permit_subtype     TEXT
[LOCKED] status             TEXT
[LOCKED] issued_date        DATE
[LOCKED] finalized_date     DATE
[LOCKED] valuation          INTEGER
[LOCKED] description        TEXT
[LOCKED] latitude           REAL
[LOCKED] longitude          REAL
[LOCKED] created_at         TIMESTAMP

---

## Entity 5: Score

Computed Opportunity Score for a property at a point in time.

[LOCKED] id                 INTEGER PRIMARY KEY AUTOINCREMENT
[LOCKED] property_id        TEXT FK → Property
[LOCKED] score_version      TEXT              (e.g. "v0.1")
[LOCKED] total_score        INTEGER           (0–100)
[LOCKED] price_score        INTEGER
[LOCKED] adu_score          INTEGER
[LOCKED] rental_score       INTEGER
[LOCKED] renovation_score   INTEGER
[LOCKED] neighborhood_score INTEGER
[LOCKED] comparable_score   INTEGER
[LOCKED] permit_score       INTEGER
[LOCKED] risk_score         INTEGER
[LOCKED] computed_at        TIMESTAMP
[LOCKED] inputs_json        TEXT              (snapshot of inputs for audit)

---

## Entity 6: Job

Queue for background processing.

[LOCKED] id                 INTEGER PRIMARY KEY AUTOINCREMENT
[LOCKED] type               TEXT              (NEW_LISTING, ENRICH_PERMIT, CALCULATE_SCORE, AI_SUMMARY, ...)
[LOCKED] payload_json       TEXT
[LOCKED] status             TEXT              (pending, processing, completed, failed)
[LOCKED] attempts           INTEGER DEFAULT 0
[LOCKED] last_error         TEXT
[LOCKED] created_at         TIMESTAMP
[LOCKED] updated_at         TIMESTAMP

---

## Entity 7: Source

Registry of every data source the system uses.

[LOCKED] source_key       TEXT PRIMARY KEY  (zillow, redfin, ladbs, census, ...)
[LOCKED] source_type      TEXT              (listing, permit, demographic, geo)
[LOCKED] display_name     TEXT
[LOCKED] base_url         TEXT
[LOCKED] is_active        INTEGER DEFAULT 1 (0/1)
[LOCKED] notes            TEXT
[LOCKED] created_at       TIMESTAMP

---

## Locked Decisions (Cannot change without version bump)

1. [LOCKED] property_id and listing_id are separate. Never merge them.
1.5. [LOCKED] Every Listing, Permit, and Demographic record must include a source_key.
2. [LOCKED] latitude/longitude live on Property, not on Listing.
3. [LOCKED] Every score row stores the score_version and inputs_json.
4. [LOCKED] ListingHistory is append-only. Never delete rows.
5. [LOCKED] APN is the canonical join to LA County data.
6. [LOCKED] source + source_listing_id is the unique key for dedup.
7. [LOCKED] Jobs table is the only way to schedule heavy work.
8. [LOCKED] Every row that comes from an external source must reference a Source row.
9. [LOCKED] zoning_code and zoning_category live on Property, not Listing. Fetched once from LA ArcGIS.

---

## Pending Decisions (To be locked in Phase 0)

- [ ] Score formula details (weights defined, but sub-metrics TBD)
- [ ] Neighborhood entity design
- [ ] Comparable entity design
- [ ] AI report storage format

---

## Next Documents

- docs/scoring.md      (Phase 0)
- docs/listing-adapter.md   (Phase 3)
- docs/la-data-sources.md   (Phase 4)
