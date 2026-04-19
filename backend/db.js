const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const dbPath = path.join(__dirname, 'data', 'store.db');

async function initDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userColumns = await db.all('PRAGMA table_info(users)');
  const hasRoleColumn = userColumns.some((column) => column.name === 'role');

  if (!hasRoleColumn) {
    await db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer';");
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS rentals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      price_per_day REAL NOT NULL,
      days INTEGER NOT NULL,
      total_price REAL NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      reminder_sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  return db;
}

module.exports = { initDb };
