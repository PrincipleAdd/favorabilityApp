/**
 * 人物相关 API 控制器
 */
import { z } from 'zod';
import type { Request, Response } from 'express';
import * as characterService from '../services/characterService.js';

/** 创建人物请求校验 */
const createCharacterSchema = z.object({
  name: z.string(),
  avatar: z.string().optional(),
  note: z.string().optional(),
});

/** 更新人物请求校验 */
const updateCharacterSchema = z.object({
  name: z.string().optional(),
  avatar: z.string().optional(),
  note: z.string().optional(),
});

/** 根据错误消息确定 HTTP 状态码 */
function getStatusCode(message: string): number {
  if (message === '人物不存在') return 404;
  if (message === '姓名不能为空') return 400;
  return 500;
}

/** 处理 service 层抛出的错误 */
function handleServiceError(err: unknown, res: Response): void {
  const message = err instanceof Error ? err.message : '服务器内部错误';
  const status = getStatusCode(message);
  res.status(status).json({ error: status === 500 ? '服务器内部错误' : message });
}

/**
 * GET /api/characters - 获取人物列表（按好感度降序）
 */
export function listCharacters(_req: Request, res: Response): void {
  const characters = characterService.listCharacters();
  res.json(characters);
}

/**
 * POST /api/characters - 创建人物
 */
export function createCharacter(req: Request, res: Response): void {
  const parsed = createCharacterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: '请求参数无效' });
    return;
  }

  try {
    const character = characterService.createCharacter(parsed.data);
    res.status(201).json(character);
  } catch (err) {
    handleServiceError(err, res);
  }
}

/**
 * GET /api/characters/:id - 获取人物详情
 */
export function getCharacter(req: Request, res: Response): void {
  const character = characterService.getCharacterById(req.params.id);
  if (!character) {
    res.status(404).json({ error: '人物不存在' });
    return;
  }
  res.json(character);
}

/**
 * PUT /api/characters/:id - 更新人物信息
 */
export function updateCharacter(req: Request, res: Response): void {
  const parsed = updateCharacterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: '请求参数无效' });
    return;
  }

  try {
    const character = characterService.updateCharacter(req.params.id, parsed.data);
    res.json(character);
  } catch (err) {
    handleServiceError(err, res);
  }
}

/**
 * DELETE /api/characters/:id - 删除人物及关联事件
 */
export function deleteCharacter(req: Request, res: Response): void {
  try {
    characterService.deleteCharacter(req.params.id);
    res.status(204).send();
  } catch (err) {
    handleServiceError(err, res);
  }
}
