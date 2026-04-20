/**
 * 数据库初始化与连接管理
 * 使用 sql.js（纯 JS SQLite 实现）
 */
import initSqlJs, { type Database } from 'sql.js';

let db: Database | null = null;

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT,
    note TEXT,
    affinity INTEGER NOT NULL DEFAULT 60 CHECK(affinity >= -100 AND affinity <= 100),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS affinity_events (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL,
    delta INTEGER NOT NULL,
    affinity_after INTEGER NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_character ON affinity_events(character_id, created_at DESC);
`;

/**
 * 初始化数据库：创建表、启用外键约束和 WAL 模式
 */
export async function initDatabase(filePath?: string): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (filePath) {
    const fs = await import('node:fs');
    try {
      const buffer = fs.readFileSync(filePath);
      db = new SQL.Database(buffer);
    } catch {
      // 文件不存在，创建新数据库
      db = new SQL.Database();
    }
  } else {
    // 内存数据库（用于测试）
    db = new SQL.Database();
  }

  // 启用外键约束
  db.run('PRAGMA foreign_keys = ON;');
  // 启用 WAL 模式
  db.run('PRAGMA journal_mode = WAL;');
  // 创建表和索引
  db.run(CREATE_TABLES_SQL);

  return db;
}

/**
 * 获取数据库实例，必须先调用 initDatabase
 */
export function getDatabase(): Database {
  if (!db) {
    throw new Error('数据库未初始化，请先调用 initDatabase');
  }
  return db;
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * 将数据库持久化到文件
 */
export function saveDatabase(filePath: string): void {
  if (!db) {
    throw new Error('数据库未初始化');
  }
  const fs = require('node:fs');
  const data = db.export();
  fs.writeFileSync(filePath, Buffer.from(data));
}
