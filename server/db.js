const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'echo.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

// ── Schema v2: multiple notes per day (no UNIQUE on date) ────────────────────
// Uses a schema_meta table to track version and run migrations safely.
db.exec(`
  CREATE TABLE IF NOT EXISTS schema_meta (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
`);

const schemaVersion = db.prepare(`SELECT value FROM schema_meta WHERE key = 'version'`).get();

if (!schemaVersion || parseInt(schemaVersion.value, 10) < 2) {
  // Migrate: recreate notes table without UNIQUE constraint on date
  db.exec(`
    BEGIN;

    CREATE TABLE IF NOT EXISTS notes_v2 (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT NOT NULL,
      content    TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Copy existing data if notes table exists
    INSERT OR IGNORE INTO notes_v2 (id, date, content, created_at, updated_at)
      SELECT id, date, content, created_at, updated_at FROM notes WHERE 1=1;

    DROP TABLE IF EXISTS notes;
    ALTER TABLE notes_v2 RENAME TO notes;

    CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date);

    INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('version', '2');

    COMMIT;
  `);
}

module.exports = db;
