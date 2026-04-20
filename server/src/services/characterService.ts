/**
 * 人物业务逻辑层
 */
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';
import type { Character, CreateCharacterRequest, UpdateCharacterRequest } from '../types.js';

/**
 * 将数据库行（snake_case）映射为 Character 对象（camelCase）
 */
function rowToCharacter(row: Record<string, unknown>): Character {
  return {
    id: row.id as string,
    name: row.name as string,
    avatar: (row.avatar as string) ?? undefined,
    note: (row.note as string) ?? undefined,
    affinity: row.affinity as number,
    createdAt: row.created_at as string,
  };
}

/**
 * 校验姓名非空（拒绝空字符串和纯空白字符串）
 */
function validateName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new Error('姓名不能为空');
  }
}

/**
 * 创建人物（好感度初始为 0）
 */
export function createCharacter(req: CreateCharacterRequest): Character {
  validateName(req.name);

  const db = getDatabase();
  const id = uuidv4();

  db.run(
    'INSERT INTO characters (id, name, avatar, note, affinity) VALUES (?, ?, ?, ?, 60)',
    [id, req.name.trim(), req.avatar ?? null, req.note ?? null]
  );

  const character = getCharacterById(id);
  if (!character) {
    throw new Error('创建人物失败');
  }
  return character;
}

/**
 * 查询人物详情
 */
export function getCharacterById(id: string): Character | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM characters WHERE id = ?');
  stmt.bind([id]);

  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return rowToCharacter(row);
  }

  stmt.free();
  return null;
}

/**
 * 更新人物信息
 */
export function updateCharacter(id: string, req: UpdateCharacterRequest): Character {
  const character = getCharacterById(id);
  if (!character) {
    throw new Error('人物不存在');
  }

  if (req.name !== undefined) {
    validateName(req.name);
  }

  const name = req.name !== undefined ? req.name.trim() : character.name;
  const avatar = req.avatar !== undefined ? req.avatar : character.avatar;
  const note = req.note !== undefined ? req.note : character.note;

  const db = getDatabase();
  db.run(
    'UPDATE characters SET name = ?, avatar = ?, note = ? WHERE id = ?',
    [name, avatar ?? null, note ?? null, id]
  );

  const updated = getCharacterById(id);
  if (!updated) {
    throw new Error('更新人物失败');
  }
  return updated;
}

/**
 * 删除人物（级联删除事件由数据库外键约束处理）
 */
export function deleteCharacter(id: string): void {
  const character = getCharacterById(id);
  if (!character) {
    throw new Error('人物不存在');
  }

  const db = getDatabase();
  db.run('DELETE FROM characters WHERE id = ?', [id]);
}

/**
 * 获取人物列表（按好感度降序排序）
 */
export function listCharacters(): Character[] {
  const db = getDatabase();
  const results = db.exec('SELECT * FROM characters ORDER BY affinity DESC, created_at ASC');

  if (results.length === 0) {
    return [];
  }

  const columns = results[0].columns;
  return results[0].values.map((row: (string | number | null | Uint8Array)[]) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col: string, i: number) => {
      obj[col] = row[i];
    });
    return rowToCharacter(obj);
  });
}
