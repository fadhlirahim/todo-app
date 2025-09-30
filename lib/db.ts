import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database;

function getDatabase() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'todos.db');
    db = new Database(dbPath);

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    // Create todos table with new features
    db.exec(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
        due_date TEXT,
        category TEXT,
        position INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if we need to migrate existing table
    const columns = db.prepare("PRAGMA table_info(todos)").all() as Array<{ name: string }>;
    const hasNewColumns = columns.some(col => col.name === 'priority');

    if (!hasNewColumns) {
      // Migrate existing table
      db.exec(`
        ALTER TABLE todos ADD COLUMN priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent'));
        ALTER TABLE todos ADD COLUMN due_date TEXT;
        ALTER TABLE todos ADD COLUMN category TEXT;
        ALTER TABLE todos ADD COLUMN position INTEGER;
      `);
    }
  }
  return db;
}

export default getDatabase();