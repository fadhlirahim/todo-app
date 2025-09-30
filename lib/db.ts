import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'todos.db'));

// Create todos table
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;