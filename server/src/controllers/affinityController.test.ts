import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDatabase, closeDatabase } from '../database.js';
import * as characterController from './characterController.js';
import * as affinityController from './affinityController.js';
import type { Request, Response } from 'express';

/** 创建模拟 Response 对象 */
function mockResponse() {
  const res: Partial<Response> = {
    statusCode: 200,
    json: function (body: unknown) {
      (res as any)._body = body;
      return res as Response;
    },
    status: function (code: number) {
      res.statusCode = code;
      return res as Response;
    },
    send: function () {
      return res as Response;
    },
  };
  return res as Response & { _body: unknown };
}

/** 创建模拟 Request 对象 */
function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as unknown as Request;
}

/** 辅助：创建一个测试人物并返回其 ID */
function createTestCharacter(name = '测试人物'): string {
  const req = mockRequest({ body: { name } });
  const res = mockResponse();
  characterController.createCharacter(req, res);
  return (res._body as any).id;
}

describe('affinityController', () => {
  beforeEach(async () => {
    await initDatabase();
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('POST /api/characters/:id/affinity (adjustAffinity)', () => {
    it('应成功调整好感度 +1', () => {
      const id = createTestCharacter();
      const req = mockRequest({ params: { id }, body: { delta: 1 } });
      const res = mockResponse();

      affinityController.adjustAffinity(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._body).toMatchObject({
        characterId: id,
        affinity: 1,
        event: { delta: 1, affinityAfter: 1 },
      });
    });

    it('应成功调整好感度 -1', () => {
      const id = createTestCharacter();
      const req = mockRequest({ params: { id }, body: { delta: -1 } });
      const res = mockResponse();

      affinityController.adjustAffinity(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._body).toMatchObject({
        characterId: id,
        affinity: -1,
        event: { delta: -1, affinityAfter: -1 },
      });
    });

    it('应支持自定义变化量和原因', () => {
      const id = createTestCharacter();
      const req = mockRequest({ params: { id }, body: { delta: 50, reason: '帮了大忙' } });
      const res = mockResponse();

      affinityController.adjustAffinity(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._body).toMatchObject({
        affinity: 50,
        event: { delta: 50, affinityAfter: 50, reason: '帮了大忙' },
      });
    });

    it('应拒绝 delta 为 0 并返回 400', () => {
      const id = createTestCharacter();
      const req = mockRequest({ params: { id }, body: { delta: 0 } });
      const res = mockResponse();

      affinityController.adjustAffinity(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._body).toEqual({ error: '变化量必须为 1-100 之间的整数' });
    });

    it('应拒绝 delta 绝对值超过 100 并返回 400', () => {
      const id = createTestCharacter();
      const req = mockRequest({ params: { id }, body: { delta: 101 } });
      const res = mockResponse();

      affinityController.adjustAffinity(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._body).toEqual({ error: '变化量必须为 1-100 之间的整数' });
    });

    it('应拒绝 delta 为小数并返回 400', () => {
      const id = createTestCharacter();
      const req = mockRequest({ params: { id }, body: { delta: 1.5 } });
      const res = mockResponse();

      affinityController.adjustAffinity(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._body).toEqual({ error: '变化量必须为 1-100 之间的整数' });
    });

    it('应拒绝缺少 delta 字段并返回 400', () => {
      const id = createTestCharacter();
      const req = mockRequest({ params: { id }, body: {} });
      const res = mockResponse();

      affinityController.adjustAffinity(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._body).toEqual({ error: '变化量必须为 1-100 之间的整数' });
    });

    it('应对不存在的人物返回 404', () => {
      const req = mockRequest({ params: { id: 'non-existent' }, body: { delta: 1 } });
      const res = mockResponse();

      affinityController.adjustAffinity(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._body).toEqual({ error: '人物不存在' });
    });

    it('好感度应被钳制在 100 以内', () => {
      const id = createTestCharacter();
      // 先加到 100
      const req1 = mockRequest({ params: { id }, body: { delta: 100 } });
      const res1 = mockResponse();
      affinityController.adjustAffinity(req1, res1);

      // 再加 1，应被钳制在 100
      const req2 = mockRequest({ params: { id }, body: { delta: 1 } });
      const res2 = mockResponse();
      affinityController.adjustAffinity(req2, res2);

      expect(res2._body).toMatchObject({ affinity: 100 });
    });

    it('好感度应被钳制在 -100 以内', () => {
      const id = createTestCharacter();
      // 先减到 -100
      const req1 = mockRequest({ params: { id }, body: { delta: -100 } });
      const res1 = mockResponse();
      affinityController.adjustAffinity(req1, res1);

      // 再减 1，应被钳制在 -100
      const req2 = mockRequest({ params: { id }, body: { delta: -1 } });
      const res2 = mockResponse();
      affinityController.adjustAffinity(req2, res2);

      expect(res2._body).toMatchObject({ affinity: -100 });
    });
  });

  describe('GET /api/characters/:id/events (getAffinityEvents)', () => {
    it('无事件时应返回空列表', () => {
      const id = createTestCharacter();
      const req = mockRequest({ params: { id } });
      const res = mockResponse();

      affinityController.getAffinityEvents(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._body).toEqual([]);
    });

    it('应返回按时间倒序排列的事件列表', () => {
      const id = createTestCharacter();

      // 创建多个事件
      affinityController.adjustAffinity(
        mockRequest({ params: { id }, body: { delta: 1, reason: '第一次' } }),
        mockResponse(),
      );
      affinityController.adjustAffinity(
        mockRequest({ params: { id }, body: { delta: 2, reason: '第二次' } }),
        mockResponse(),
      );

      const req = mockRequest({ params: { id } });
      const res = mockResponse();
      affinityController.getAffinityEvents(req, res);

      const events = res._body as any[];
      expect(events.length).toBe(2);
      // 时间倒序：最新的在前
      expect(events[0].delta).toBe(2);
      expect(events[1].delta).toBe(1);
    });

    it('应对不存在的人物返回 404', () => {
      const req = mockRequest({ params: { id: 'non-existent' } });
      const res = mockResponse();

      affinityController.getAffinityEvents(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._body).toEqual({ error: '人物不存在' });
    });
  });
});
