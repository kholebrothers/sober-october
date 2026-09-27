-- Das Schema der Teilnahme. Tabellen und Spalten sind die von kur-core
-- (server/schema.sql, Stand f9e139a), dazu eine Spalte: `raum`.
--
-- Live und Vorschau teilen sich eine D1 (dieselbe Worker-Bindung). Damit
-- eine Vorschau nie in die Gruppe von live schreibt, gehört jede Person zu
-- einem Raum: "live" oder "vorschau". Der Worker bestimmt ihn aus der
-- Adresse, nie die Anfrage selbst.
--
-- Hier stehen nur Namen, das Commitment als Schlüssel und die Tage "dabei".
-- Einträge, Gefühle und Notizen bleiben im Gerät (siehe README).

CREATE TABLE IF NOT EXISTS people (
  id         TEXT PRIMARY KEY,
  raum       TEXT NOT NULL,
  name       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS entries (
  date       TEXT NOT NULL,
  person_id  TEXT NOT NULL,
  habit      TEXT NOT NULL,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (date, person_id, habit)
);
CREATE INDEX IF NOT EXISTS entries_by_person ON entries (person_id);

CREATE TABLE IF NOT EXISTS settings (
  person_id  TEXT NOT NULL,
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  ab         TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (person_id, key)
);

-- Namen sind die Identität — zweimal "Kim" im selben Raum wäre nicht
-- auseinanderzuhalten.
CREATE UNIQUE INDEX IF NOT EXISTS people_by_name ON people (raum, name COLLATE NOCASE);
