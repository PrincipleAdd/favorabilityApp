import { describe, it, expect, afterEach } from 'vitest';
import { initDatabase, getDatabase, closeDatabase } from './database.js';

describe('database', () => {
  afterEach(() => {
    closeDatabase();
  });

  it('应初始化内存数据库并创建表', async () => {
    const db = await initDatabase();
    // 验证 characters 表存在
    const tables = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('characters', 'affinity_events') ORDER BY name"
    );
    const tableNames = tables[0].values.map((row) => row[0]);
    expect(tableNames).toContain('affinity_events');
    expect(tableNames).toContain('characters');
  });

  it('应启用外键约束', async () => {
    const db = await initDatabase();
    const result = db.exec('PRAGMA foreign_keys;');
    expect(result[0].values[0][0]).toBe(1);
  });

  it('getDatabase 在未初始化时应抛出错误', () => {
    expect(() => getDatabase()).toThrow('数据库未初始化');
  });

  it('getDatabase 在初始化后应返回数据库实例', async () => {
    await initDatabase();
    const db = getDatabase();
    expect(db).toBeDefined();
  });

  it('重复调用 initDatabase 应返回同一实例', async () => {
    const db1 = await initDatabase();
    const db2 = await initDatabase();
    expect(db1).toBe(db2);
  });

  it('characters 表应包含 CHECK 约束（好感度范围）', async () => {
    const db = await initDatabase();
    // 插入合法数据应成功
    db.run(
      "INSERT INTO characters (id, name, affinity) VALUES ('test-1', '测试人物', 50)"
    );
    const result = db.exec("SELECT affinity FROM characters WHERE id = 'test-1'");
    expect(result[0].values[0][0]).toBe(50);

    // 插入超出范围的数据应失败
    expect(() =>
      db.run(
        "INSERT INTO characters (id, name, affinity) VALUES ('test-2', '测试人物2', 101)"
      )
    ).toThrow();
  });

  it('affinity_events 表应有外键约束（级联删除）', async () => {
    const db = await initDatabase();
    // 创建人物
    db.run(
      "INSERT INTO characters (id, name, affinity) VALUES ('char-1', '人物A', 10)"
    );
    // 创建事件
    db.run(
      "INSERT INTO affinity_events (id, character_id, delta, affinity_after) VALUES ('evt-1', 'char-1', 10, 10)"
    );
    // 删除人物，事件应级联删除
    db.run("DELETE FROM characters WHERE id = 'char-1'");
    const events = db.exec(
      "SELECT * FROM affinity_events WHERE character_id = 'char-1'"
    );
    expect(events.length).toBe(0);
  });

  it('idx_events_character 索引应存在', async () => {
    const db = await initDatabase();
    const result = db.exec(
      "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_events_character'"
    );
    expect(result[0].values[0][0]).toBe('idx_events_character');
  });
});
