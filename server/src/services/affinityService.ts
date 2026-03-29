/**
 * 好感度业务逻辑层
 */
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database.js';
import { getCharacterById } from './characterService.js';
import type { AffinityEvent, AdjustAffinityRequest, AdjustAffinityResponse } from '../types.js';

/**
 * 好感度钳制函数：将 current + delta 的结果限制在 [-100, 100] 范围内
 */
export function clampAffinity(current: number, delta: number): number {
  return Math.max(-100, Math.min(100, current + delta));
}

/**
 * 将数据库行（snake_case）映射为 AffinityEvent 对象（camelCase）
 */
function rowToAffinityEvent(row: Record<string, unknown>): AffinityEvent {
  return {
    id: row.id as string,
    characterId: row.character_id as string,
    delta: row.delta as number,
    affinityAfter: row.affinity_after as number,
    reason: (row.reason as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

/**
 * 校验变化量（delta）的绝对值必须在 1-100 之间的整数
 */
function validateDelta(delta: number): void {
  const abs = Math.abs(delta);
  if (!Number.isInteger(delta) || abs < 1 || abs > 100) {
    throw new Error('变化量必须为 1-100 之间的整数');
  }
}

/**
 * 调整人物好感度
 * 1. 校验变化量
 * 2. 查询人物是否存在
 * 3. 计算钳制后数值
 * 4. 更新人物好感度
 * 5. 创建事件记录
 */
export function adjustAffinity(characterId: string, req: AdjustAffinityRequest): AdjustAffinityResponse {
  validateDelta(req.delta);

  const character = getCharacterById(characterId);
  if (!character) {
    throw new Error('人物不存在');
  }

  const newAffinity = clampAffinity(character.affinity, req.delta);
  const db = getDatabase();

  // 更新人物好感度
  db.run('UPDATE characters SET affinity = ? WHERE id = ?', [newAffinity, characterId]);

  // 创建事件记录
  const eventId = uuidv4();
  db.run(
    'INSERT INTO affinity_events (id, character_id, delta, affinity_after, reason) VALUES (?, ?, ?, ?, ?)',
    [eventId, characterId, req.delta, newAffinity, req.reason ?? null]
  );

  // 查询刚创建的事件记录
  const stmt = db.prepare('SELECT * FROM affinity_events WHERE id = ?');
  stmt.bind([eventId]);
  let event: AffinityEvent | null = null;
  if (stmt.step()) {
    event = rowToAffinityEvent(stmt.getAsObject());
  }
  stmt.free();

  if (!event) {
    throw new Error('创建事件记录失败');
  }

  return {
    characterId,
    affinity: newAffinity,
    event: {
      id: event.id,
      delta: event.delta,
      affinityAfter: event.affinityAfter,
      reason: event.reason,
      createdAt: event.createdAt,
    },
  };
}

/**
 * 获取人物好感度事件列表（按时间倒序）
 */
export function getAffinityEvents(characterId: string): AffinityEvent[] {
  const character = getCharacterById(characterId);
  if (!character) {
    throw new Error('人物不存在');
  }

  const db = getDatabase();
  const results = db.exec(
    'SELECT * FROM affinity_events WHERE character_id = ? ORDER BY created_at DESC, rowid DESC',
    [characterId]
  );

  if (results.length === 0) {
    return [];
  }

  const columns = results[0].columns;
  return results[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return rowToAffinityEvent(obj);
  });
}
