import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  Character,
  AffinityEvent,
  CreateCharacterRequest,
  UpdateCharacterRequest,
  AdjustAffinityRequest,
  AdjustAffinityResponse,
  ErrorResponse,
} from '../types';

/** 后台服务基础地址，可通过环境变量配置 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/** 请求超时时间（毫秒） */
const TIMEOUT_MS = 3000;

/** 最大自动重试次数 */
const MAX_RETRIES = 2;

/** 重试间隔（毫秒） */
const RETRY_DELAY_MS = 1000;

/**
 * 判断是否为网络异常（值得重试的错误）
 */
function isNetworkError(error: AxiosError): boolean {
  return (
    !error.response &&
    error.code !== 'ECONNABORTED' &&
    error.code !== 'ERR_CANCELED'
  );
}

/**
 * 延迟指定毫秒
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 创建配置好的 Axios 实例
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
  });

  // 响应错误拦截器：自动重试网络异常
  client.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    // 初始化重试计数
    const retryCount = (config as any).__retryCount ?? 0;

    if (isNetworkError(error) && retryCount < MAX_RETRIES) {
      (config as any).__retryCount = retryCount + 1;
      await delay(RETRY_DELAY_MS);
      return client.request(config);
    }

    return Promise.reject(error);
  });

  return client;
}

const apiClient = createApiClient();

// ============ 人物 CRUD ============

/** 获取人物列表（按好感度降序） */
export async function getCharacters(): Promise<Character[]> {
  const { data } = await apiClient.get<Character[]>('/api/characters');
  return data;
}

/** 创建人物 */
export async function createCharacter(
  req: CreateCharacterRequest,
): Promise<Character> {
  const { data } = await apiClient.post<Character>('/api/characters', req);
  return data;
}

/** 获取人物详情 */
export async function getCharacter(id: string): Promise<Character> {
  const { data } = await apiClient.get<Character>(`/api/characters/${id}`);
  return data;
}

/** 更新人物信息 */
export async function updateCharacter(
  id: string,
  req: UpdateCharacterRequest,
): Promise<Character> {
  const { data } = await apiClient.put<Character>(
    `/api/characters/${id}`,
    req,
  );
  return data;
}

/** 删除人物 */
export async function deleteCharacter(id: string): Promise<void> {
  await apiClient.delete(`/api/characters/${id}`);
}

// ============ 好感度调整 ============

/** 调整好感度 */
export async function adjustAffinity(
  id: string,
  req: AdjustAffinityRequest,
): Promise<AdjustAffinityResponse> {
  const { data } = await apiClient.post<AdjustAffinityResponse>(
    `/api/characters/${id}/affinity`,
    req,
  );
  return data;
}

// ============ 事件查询 ============

/** 获取人物好感度事件列表（时间倒序） */
export async function getEvents(id: string): Promise<AffinityEvent[]> {
  const { data } = await apiClient.get<AffinityEvent[]>(
    `/api/characters/${id}/events`,
  );
  return data;
}

// ============ 工具函数导出（供测试使用） ============

export { apiClient, BASE_URL, isNetworkError };
