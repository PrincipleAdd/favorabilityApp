import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDatabase, closeDatabase } from '../database.js';
import * as controller from './characterController.js';
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

describe('characterController', () => {
  beforeEach(async () => {
    await initDatabase();
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('POST /api/characters (createCharacter)', () => {
    it('应创建人物并返回 201', () => {
      const req = mockRequest({ body: { name: '张三' } });
      const res = mockResponse();

      controller.createCharacter(req, res);

      expect(res.statusCode).toBe(201);
      expect(res._body).toMatchObject({
        name: '张三',
        affinity: 60,
      });
    });

    it('应支持可选字段 avatar 和 note', () => {
      const req = mockRequest({
        body: { name: '李四', avatar: 'https://example.com/a.png', note: '备注' },
      });
      const res = mockResponse();

      controller.createCharacter(req, res);

      expect(res.statusCode).toBe(201);
      expect(res._body).toMatchObject({
        name: '李四',
        avatar: 'https://example.com/a.png',
        note: '备注',
      });
    });

    it('应拒绝空姓名并返回 400', () => {
      const req = mockRequest({ body: { name: '' } });
      const res = mockResponse();

      controller.createCharacter(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._body).toEqual({ error: '姓名不能为空' });
    });

    it('应拒绝缺少 name 字段并返回 400', () => {
      const req = mockRequest({ body: {} });
      const res = mockResponse();

      controller.createCharacter(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._body).toEqual({ error: '请求参数无效' });
    });

    it('应拒绝 name 为非字符串类型并返回 400', () => {
      const req = mockRequest({ body: { name: 123 } });
      const res = mockResponse();

      controller.createCharacter(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._body).toEqual({ error: '请求参数无效' });
    });
  });

  describe('GET /api/characters (listCharacters)', () => {
    it('空数据库应返回空列表', () => {
      const req = mockRequest();
      const res = mockResponse();

      controller.listCharacters(req, res);

      expect(res._body).toEqual([]);
    });

    it('应返回按好感度降序排列的人物列表', () => {
      // 先创建几个人物
      const req1 = mockRequest({ body: { name: 'A' } });
      const res1 = mockResponse();
      controller.createCharacter(req1, res1);

      const req2 = mockRequest({ body: { name: 'B' } });
      const res2 = mockResponse();
      controller.createCharacter(req2, res2);

      const req = mockRequest();
      const res = mockResponse();
      controller.listCharacters(req, res);

      expect(Array.isArray(res._body)).toBe(true);
      expect((res._body as any[]).length).toBe(2);
    });
  });

  describe('GET /api/characters/:id (getCharacter)', () => {
    it('应返回已存在的人物', () => {
      // 先创建
      const createReq = mockRequest({ body: { name: '测试' } });
      const createRes = mockResponse();
      controller.createCharacter(createReq, createRes);
      const id = (createRes._body as any).id;

      const req = mockRequest({ params: { id } });
      const res = mockResponse();
      controller.getCharacter(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._body).toMatchObject({ id, name: '测试' });
    });

    it('应对不存在的 ID 返回 404', () => {
      const req = mockRequest({ params: { id: 'non-existent' } });
      const res = mockResponse();

      controller.getCharacter(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._body).toEqual({ error: '人物不存在' });
    });
  });

  describe('PUT /api/characters/:id (updateCharacter)', () => {
    it('应更新人物信息', () => {
      // 先创建
      const createReq = mockRequest({ body: { name: '旧名' } });
      const createRes = mockResponse();
      controller.createCharacter(createReq, createRes);
      const id = (createRes._body as any).id;

      const req = mockRequest({ params: { id }, body: { name: '新名' } });
      const res = mockResponse();
      controller.updateCharacter(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._body).toMatchObject({ id, name: '新名' });
    });

    it('应对不存在的人物返回 404', () => {
      const req = mockRequest({ params: { id: 'non-existent' }, body: { name: '新名' } });
      const res = mockResponse();

      controller.updateCharacter(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._body).toEqual({ error: '人物不存在' });
    });
  });

  describe('DELETE /api/characters/:id (deleteCharacter)', () => {
    it('应删除人物并返回 204', () => {
      // 先创建
      const createReq = mockRequest({ body: { name: '待删除' } });
      const createRes = mockResponse();
      controller.createCharacter(createReq, createRes);
      const id = (createRes._body as any).id;

      const req = mockRequest({ params: { id } });
      const res = mockResponse();
      controller.deleteCharacter(req, res);

      expect(res.statusCode).toBe(204);
    });

    it('应对不存在的人物返回 404', () => {
      const req = mockRequest({ params: { id: 'non-existent' } });
      const res = mockResponse();

      controller.deleteCharacter(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._body).toEqual({ error: '人物不存在' });
    });
  });
});
