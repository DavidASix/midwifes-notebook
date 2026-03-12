# Database Schema

Local SQLite database managed via `expo-sqlite` and Drizzle ORM. All schema changes are handled through Drizzle migrations run on app startup.

---

## Table: `clients`

Primary record for each client. Partner details are embedded as prefixed columns. Client **status** is derived at query time — not stored — using `is_active` and `actual_delivery_date`:

| Condition | Derived Status |
|---|---|
| `is_active = 0` | Out of Care |
| `is_active = 1` AND `actual_delivery_date IS NULL` | Prenatal |
| `is_active = 1` AND `actual_delivery_date IS NOT NULL` | Postpartum |

```sql
CREATE TABLE clients (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Name
  first_name              TEXT NOT NULL,
  last_name               TEXT NOT NULL,
  middle_name             TEXT,
  preferred_name          TEXT,

  -- Contact
  address                 TEXT,
  primary_phone           TEXT,

  -- Identity
  date_of_birth           TEXT,                          -- ISO 8601 (YYYY-MM-DD); nullable if unknown
  age                     INTEGER,                       -- Only populated when date_of_birth is unavailable
  photo_path              TEXT,                          -- Local filesystem path to client photo

  -- Pregnancy
  estimated_delivery_date TEXT,                          -- ISO 8601
  actual_delivery_date    TEXT,                          -- ISO 8601; NULL until delivered
  gravida                 INTEGER,                       -- Total pregnancies
  parity                  INTEGER,                       -- Total deliveries

  -- Clinical
  blood_type              TEXT CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  rh_status               TEXT CHECK (rh_status IN ('+','-')),
  gbs_status              TEXT CHECK (gbs_status IN ('+','-')),
  delivery_method         TEXT CHECK (delivery_method IN ('SVD','AVD','C-Section')),
  tear_degree             INTEGER CHECK (tear_degree IN (1, 2, 3, 4)),
  risk_factors            TEXT,                          -- Free text

  -- Partner
  partner_name            TEXT,
  partner_relationship    TEXT,
  partner_phone           TEXT,                          -- Emergency contact number
  partner_blood_type      TEXT CHECK (partner_blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),

  -- Status
  is_active               INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),

  -- Timestamps
  created_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at              TEXT                           -- Soft delete; NULL = not deleted
);
```

---

## Table: `babies`

Zero or more babies per client. **Age in days** is derived from `date_of_birth` at query/display time.

```sql
CREATE TABLE babies (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id               INTEGER NOT NULL REFERENCES clients (id),

  -- Identity
  name                    TEXT,
  sex                     TEXT CHECK (sex IN ('male', 'female', 'unknown')),
  date_of_birth           TEXT,                          -- ISO 8601

  -- Birth details
  birth_weight_grams      INTEGER,                       -- Stored in grams; lbs/oz displayed by the app
  gestational_age_days    INTEGER,                       -- Total days; weeks derived by the app (÷ 7)

  -- Clinical
  blood_type              TEXT CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  feeding_type            TEXT CHECK (feeding_type IN ('breast_milk', 'formula', 'combination')),
  risk_factors            TEXT,                          -- Free text

  -- Timestamps
  created_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at              TEXT
);
```

---

## Table: `notes`

Many notes belong to one client.

```sql
CREATE TABLE notes (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id               INTEGER NOT NULL REFERENCES clients (id),

  title                   TEXT,
  content                 TEXT,
  note_date               TEXT,                          -- ISO 8601; date the note pertains to

  -- Timestamps
  created_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at              TEXT
);
```

---

## Table: `settings`

Entity-Attribute-Value table for app-wide settings. The `value_type` column tells the app how to cast the stored text value.

```sql
CREATE TABLE settings (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  key                     TEXT NOT NULL UNIQUE,
  value                   TEXT,
  value_type              TEXT NOT NULL DEFAULT 'string'
                            CHECK (value_type IN ('string', 'integer', 'boolean', 'json'))
);
```

---

## Notes

- All dates are stored as **ISO 8601 text** (`YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SS.sssZ`). SQLite has no native date type; text ISO 8601 sorts correctly and is compatible with Drizzle's date helpers.
- `deleted_at` soft deletes are used on `clients`, `babies`, and `notes`. Queries should filter `WHERE deleted_at IS NULL` by default.
- `updated_at` must be kept current via Drizzle model hooks or a SQLite `AFTER UPDATE` trigger.
- `birth_weight_grams` is the single source of truth for weight. The UI layer handles conversion to lbs/oz for display.
- `age` on `clients` is only populated when `date_of_birth` is unknown; otherwise it is always `NULL` and age is derived from `date_of_birth`.
