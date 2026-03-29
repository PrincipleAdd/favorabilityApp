import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDatabase, closeDatabase } from '../database.js';
import { createCharacter } from './characterService.js';
import { clampAffinity, adjustAffinity, getAffinityEvents } from './affinityService.js';

describe('affinityService', () => {
  beforeEach(async () => {
    await initDatabase(); // 内存数据库
  });

  afterEach(() => {
    closeDatabase();
  });

  // ========== clampAffinity ==========

  describe('clampAffinity', () => {
    it('正常范围内应返回 current + delta', () => {
      expect(clampAffinity(0, 10)).toBe(10);
      expect(clampAffinity(50, -30)).toBe(20);
    });

    it('超过上限应钳制到 100', () => {
      expect(clampAffinity(90, 20)).toBe(100);
      expect(clampAffinity(100, 1)).toBe(100);
    });

    it('低于下限应钳制到 -100', () => {
      expect(clampAffinity(-90, -20)).toBe(-100);
      expect(clampAffinity(-100, -1)).toBe(-100);
    });

    it('边界值应正确处理', () => {
      expect(clampAffinity(0, 100)).toBe(100);
      expect(clampAffinity(0, -100)).toBe(-100);
      expect(clampAffinity(-100, 0)).toBe(-100);
      expect(clampAffinity(100, 0)).toBe(100);
    });
  });

  // ========== adjustAffinity ==========

  describe('adjustAffinity', () => {
    it('应正确调整好感度并返回完整响应', () => {
      const character = createCharacter({ name: '测试人物' });
      const result = adjustAffinity(character.id, { delta: 10, reason: '帮了忙' });

      expect(result.characterId).toBe(character.id);
      expect(result.affinity).toBe(10);
      expect(result.event.delta).toBe(10);
      expect(result.event.affinityAfter).toBe(10);
      expect(result.event.reason).toBe('帮了忙');
      expect(result.event.id).toBeDefined();
      expect(result.event.createdAt).toBeDefined();
    });

    it('应支持负数 delta', () => {
      const character = createCharacter({ name: '测试' });
      const result = adjustAffinity(character.id, { delta: -5 });
      expect(result.affinity).toBe(-5);
      expect(result.event.delta).toBe(-5);
    });

    it('reason 为可选字段', () => {
      const character = createCharacter({ name: '测试' });
      const result = adjustAffinity(character.id, { delta: 1 });
      expect(result.event.reason).toBeUndefined();
    });

    it('应钳制超出范围的好感度', () => {
      const character = createCharacter({ name: '测试' });
      const result = adjustAffinity(character.id, { delta: 100 });
      expect(result.affinity).toBe(100);

      const result2 = adjustAffinity(character.id, { delta: 50 });
      expect(result2.affinity).toBe(100);
    });

    it('应拒绝 delta 为 0', () => {
      const character = createCharacter({ name: '测试' });
      expect(() => adjustAffinity(character.id, { delta: 0 })).toThrow('变化量必须为 1-100 之间的整数');
    });

    it('应拒绝 delta 绝对值超过 100', () => {
      const character = createCharacter({ name: '测试' });
      expect(() => adjustAffinity(character.id, { delta: 101 })).toThrow('变化量必须为 1-100 之间的整数');
      expect(() => adjustAffinity(character.id, { delta: -101 })).toThrow('变化量必须为 1-100 之间的整数');
    });

    it('应拒绝小数 delta', () => {
      const character = createCharacter({ name: '测试' });
      expect(() => adjustAffinity(character.id, { delta: 1.5 })).toThrow('变化量必须为 1-100 之间的整数');
    });

    it('应对不存在的人物抛出错误', () => {
      expect(() => adjustAffinity('non-existent', { delta: 1 })).toThrow('人物不存在');
    });
  });

  // ========== getAffinityEvents ==========

  describe('getAffinityEvents', () => {
    it('无事件时应返回空列表', () => {
      const character = createCharacter({ name: '测试' });
      expect(getAffinityEvents(character.id)).toEqual([]);
    });

    it('应返回该人物的所有事件', () => {
      const character = createCharacter({ name: '测试' });
      adjustAffinity(character.id, { delta: 5, reason: '事件1' });
      adjustAffinity(character.id, { delta: -3, reason: '事件2' });

      const events = getAffinityEvents(character.id);
      expect(events.length).toBe(2);
    });

    it('应按时间倒序排列', () => {
      const character = createCharacter({ name: '测试' });
      adjustAffinity(character.id, { delta: 1, reason: '第一次' });
      adjustAffinity(character.id, { delta: 2, reason: '第二次' });
      adjustAffinity(character.id, { delta: 3, reason: '第三次' });

      const events = getAffinityEvents(character.id);
      expect(events[0].reason).toBe('第三次');
      expect(events[1].reason).toBe('第二次');
      expect(events[2].reason).toBe('第一次');
    });

    it('应对不存在的人物抛出错误', () => {
      expect(() => getAffinityEvents('non-existent')).toThrow('人物不存在');
    });

    it('不应返回其他人物的事件', () => {
      const c1 = createCharacter({ name: '人物1' });
      const c2 = createCharacter({ name: '人物2' });
      adjustAffinity(c1.id, { delta: 5 });
      adjustAffinity(c2.id, { delta: 10 });

      const events = getAffinityEvents(c1.id);
      expect(events.length).toBe(1);
      expect(events[0].characterId).toBe(c1.id);
    });
  });
});
