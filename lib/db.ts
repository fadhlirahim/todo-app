import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database;

function getDatabase() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'todos.db');
    db = new Database(dbPath);

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    // Create todos table
    db.exec(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        due_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if we need to migrate existing table
    const columns = db.prepare("PRAGMA table_info(todos)").all() as Array<{ name: string }>;
    const hasDueDate = columns.some(col => col.name === 'due_date');
    const hasCompletedBy = columns.some(col => col.name === 'completed_by');

    if (!hasDueDate) {
      // Migrate existing table
      db.exec(`ALTER TABLE todos ADD COLUMN due_date TEXT;`);
    }

    if (!hasCompletedBy) {
      // Add completed_by column
      db.exec(`ALTER TABLE todos ADD COLUMN completed_by TEXT;`);
    }
  }
  return db;
}

export default getDatabase();