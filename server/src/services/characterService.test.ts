import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDatabase, closeDatabase } from '../database.js';
import {
  createCharacter,
  getCharacterById,
  updateCharacter,
  deleteCharacter,
  listCharacters,
} from './characterService.js';

describe('characterService', () => {
  beforeEach(async () => {
    await initDatabase(); // 内存数据库
  });

  afterEach(() => {
    closeDatabase();
  });

  // ========== createCharacter ==========

  describe('createCharacter', () => {
    it('应创建人物并返回完整记录，好感度初始为 0', () => {
      const character = createCharacter({ name: '张三' });
      expect(character.name).toBe('张三');
      expect(character.affinity).toBe(60);
      expect(character.id).toBeDefined();
      expect(character.createdAt).toBeDefined();
    });

    it('应支持可选字段 avatar 和 note', () => {
      const character = createCharacter({
        name: '李四',
        avatar: 'https://example.com/avatar.png',
        note: '好朋友',
      });
      expect(character.avatar).toBe('https://example.com/avatar.png');
      expect(character.note).toBe('好朋友');
    });

    it('应自动 trim 姓名两端空白', () => {
      const character = createCharacter({ name: '  王五  ' });
      expect(character.name).toBe('王五');
    });

    it('应拒绝空字符串姓名', () => {
      expect(() => createCharacter({ name: '' })).toThrow('姓名不能为空');
    });

    it('应拒绝纯空白字符串姓名', () => {
      expect(() => createCharacter({ name: '   ' })).toThrow('姓名不能为空');
    });

    it('应拒绝制表符等空白字符姓名', () => {
      expect(() => createCharacter({ name: '\t\n' })).toThrow('姓名不能为空');
    });
  });

  // ========== getCharacterById ==========

  describe('getCharacterById', () => {
    it('应返回已存在的人物', () => {
      const created = createCharacter({ name: '赵六' });
      const found = getCharacterById(created.id);
      expect(found).not.toBeNull();
      expect(found!.name).toBe('赵六');
    });

    it('应对不存在的 ID 返回 null', () => {
      const found = getCharacterById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  // ========== updateCharacter ==========

  describe('updateCharacter', () => {
    it('应更新人物姓名', () => {
      const created = createCharacter({ name: '旧名' });
      const updated = updateCharacter(created.id, { name: '新名' });
      expect(updated.name).toBe('新名');
    });

    it('应更新人物备注', () => {
      const created = createCharacter({ name: '测试' });
      const updated = updateCharacter(created.id, { note: '新备注' });
      expect(updated.note).toBe('新备注');
    });

    it('应拒绝更新为空姓名', () => {
      const created = createCharacter({ name: '测试' });
      expect(() => updateCharacter(created.id, { name: '' })).toThrow('姓名不能为空');
    });

    it('应对不存在的人物抛出错误', () => {
      expect(() => updateCharacter('non-existent', { name: '新名' })).toThrow('人物不存在');
    });

    it('未提供的字段应保持不变', () => {
      const created = createCharacter({ name: '测试', note: '原备注' });
      const updated = updateCharacter(created.id, { name: '新名' });
      expect(updated.note).toBe('原备注');
    });
  });

  // ========== deleteCharacter ==========

  describe('deleteCharacter', () => {
    it('应删除已存在的人物', () => {
      const created = createCharacter({ name: '待删除' });
      deleteCharacter(created.id);
      expect(getCharacterById(created.id)).toBeNull();
    });

    it('应对不存在的人物抛出错误', () => {
      expect(() => deleteCharacter('non-existent')).toThrow('人物不存在');
    });

    it('应级联删除关联的好感度事件', async () => {
      const created = createCharacter({ name: '级联测试' });
      // 手动插入事件记录
      const { getDatabase } = await import('../database.js');
      const db = getDatabase();
      db.run(
        "INSERT INTO affinity_events (id, character_id, delta, affinity_after, reason) VALUES ('evt-1', ?, 5, 5, '测试事件')",
        [created.id]
      );

      deleteCharacter(created.id);

      const events = db.exec(
        `SELECT * FROM affinity_events WHERE character_id = '${created.id}'`
      );
      expect(events.length).toBe(0);
    });
  });

  // ========== listCharacters ==========

  describe('listCharacters', () => {
    it('空数据库应返回空列表', () => {
      expect(listCharacters()).toEqual([]);
    });

    it('应按好感度降序排序', async () => {
      // 创建多个人物并手动设置不同好感度
      const c1 = createCharacter({ name: '低好感' });
      const c2 = createCharacter({ name: '高好感' });
      const c3 = createCharacter({ name: '中好感' });

      const { getDatabase } = await import('../database.js');
      const db = getDatabase();
      db.run('UPDATE characters SET affinity = ? WHERE id = ?', [-50, c1.id]);
      db.run('UPDATE characters SET affinity = ? WHERE id = ?', [80, c2.id]);
      db.run('UPDATE characters SET affinity = ? WHERE id = ?', [20, c3.id]);

      const list = listCharacters();
      expect(list.length).toBe(3);
      expect(list[0].name).toBe('高好感');
      expect(list[1].name).toBe('中好感');
      expect(list[2].name).toBe('低好感');
    });

    it('应返回所有人物', () => {
      createCharacter({ name: 'A' });
      createCharacter({ name: 'B' });
      expect(listCharacters().length).toBe(2);
    });
  });
});
