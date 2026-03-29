/**
 * 好感度相关 API 控制器
 */
import { z } from 'zod';
import type { Request, Response } from 'express';
import * as affinityService from '../services/affinityService.js';

/** 调整好感度请求校验：delta 为整数，绝对值在 1-100 范围内 */
const adjustAffinitySchema = z.object({
  delta: z.number().int().refine((v) => {
    const abs = Math.abs(v);
    return abs >= 1 && abs <= 100;
  }, { message: '变化量必须为 1-100 之间的整数' }),
  reason: z.string().optional(),
});

/** 根据错误消息确定 HTTP 状态码 */
function getStatusCode(message: string): number {
  if (message === '人物不存在') return 404;
  if (message === '变化量必须为 1-100 之间的整数') return 400;
  return 500;
}

/** 处理 service 层抛出的错误 */
function handleServiceError(err: unknown, res: Response): void {
  const message = err instanceof Error ? err.message : '服务器内部错误';
  const status = getStatusCode(message);
  res.status(status).json({ error: status === 500 ? '服务器内部错误' : message });
}

/**
 * POST /api/characters/:id/affinity - 调整好感度
 */
export function adjustAffinity(req: Request, res: Response): void {
  const parsed = adjustAffinitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: '变化量必须为 1-100 之间的整数' });
    return;
  }

  try {
    const result = affinityService.adjustAffinity(req.params.id, parsed.data);
    res.json(result);
  } catch (err) {
    handleServiceError(err, res);
  }
}

/**
 * GET /api/characters/:id/events - 获取好感度事件列表（时间倒序）
 */
export function getAffinityEvents(req: Request, res: Response): void {
  try {
    const events = affinityService.getAffinityEvents(req.params.id);
    res.json(events);
  } catch (err) {
    handleServiceError(err, res);
  }
}
