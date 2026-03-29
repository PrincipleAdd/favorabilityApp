/**
 * 全局错误处理中间件
 * 将 service 层抛出的错误映射为规范的 HTTP 错误响应
 */
import type { Request, Response, NextFunction } from 'express';

/** 根据错误消息确定 HTTP 状态码 */
function getStatusCode(message: string): number {
  if (message === '人物不存在') return 404;
  if (message === '姓名不能为空') return 400;
  if (message === '变化量必须为 1-100 之间的整数') return 400;
  return 500;
}

/**
 * Express 错误处理中间件
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = getStatusCode(err.message);
  const message = status === 500 ? '服务器内部错误' : err.message;
  res.status(status).json({ error: message });
}
