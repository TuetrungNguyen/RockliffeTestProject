import Database from 'better-sqlite3';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

//Database file path
const DB_PATH = join(process.cwd(), 'src', 'lib', 'northwind.db');
console.log('[DB] Path =', DB_PATH, 'exists:', existsSync(DB_PATH));

//Database connection instance
let _db: Database.Database | null = null;

//Function to get database connection
export function db() {
  if (!_db) {
    _db = new Database(DB_PATH, { fileMustExist: true });
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}
