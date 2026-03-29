/**
 * 好感度管理系统 - 后端类型定义
 */

// ============ 数据模型 ============

/** 人物档案 */
export interface Character {
  id: string;
  name: string;
  avatar?: string;
  note?: string;
  /** 好感度数值，范围 -100 到 100 */
  affinity: number;
  createdAt: string;
}

/** 好感度事件记录 */
export interface AffinityEvent {
  id: string;
  characterId: string;
  /** 变化值 */
  delta: number;
  /** 变化后的好感度数值 */
  affinityAfter: number;
  /** 原因描述 */
  reason?: string;
  createdAt: string;
}

// ============ 请求类型 ============

/** 创建人物请求 */
export interface CreateCharacterRequest {
  name: string;
  avatar?: string;
  note?: string;
}

/** 更新人物请求 */
export interface UpdateCharacterRequest {
  name?: string;
  avatar?: string;
  note?: string;
}

/** 调整好感度请求 */
export interface AdjustAffinityRequest {
  /** 变化值 */
  delta: number;
  /** 原因描述 */
  reason?: string;
}

// ============ 响应类型 ============

/** 调整好感度响应 */
export interface AdjustAffinityResponse {
  characterId: string;
  affinity: number;
  event: Omit<AffinityEvent, 'characterId'>;
}

/** API 错误响应 */
export interface ErrorResponse {
  error: string;
}
