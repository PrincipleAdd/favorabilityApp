import { describe, it, expect } from 'vitest';
import { errorHandler } from './errorHandler.js';
import type { Request, Response, NextFunction } from 'express';

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
  };
  return res as Response & { _body: unknown };
}

describe('errorHandler', () => {
  const req = {} as Request;
  const next = (() => {}) as NextFunction;

  it('应将"姓名不能为空"映射为 400', () => {
    const res = mockResponse();
    errorHandler(new Error('姓名不能为空'), req, res, next);
    expect(res.statusCode).toBe(400);
    expect(res._body).toEqual({ error: '姓名不能为空' });
  });

  it('应将"人物不存在"映射为 404', () => {
    const res = mockResponse();
    errorHandler(new Error('人物不存在'), req, res, next);
    expect(res.statusCode).toBe(404);
    expect(res._body).toEqual({ error: '人物不存在' });
  });

  it('应将"变化量必须为 1-100 之间的整数"映射为 400', () => {
    const res = mockResponse();
    errorHandler(new Error('变化量必须为 1-100 之间的整数'), req, res, next);
    expect(res.statusCode).toBe(400);
    expect(res._body).toEqual({ error: '变化量必须为 1-100 之间的整数' });
  });

  it('应将未知错误映射为 500 并返回通用消息', () => {
    const res = mockResponse();
    errorHandler(new Error('数据库连接失败'), req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res._body).toEqual({ error: '服务器内部错误' });
  });
});
