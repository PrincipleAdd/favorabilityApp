/**
 * 同步管理器
 * 监听网络状态，在恢复连接时自动同步离线操作
 */
import * as Network from 'expo-network';
import * as api from '../api/client';
import {
  loadSyncQueue,
  saveSyncQueue,
  clearSyncQueue,
  type SyncAction,
} from './localStorage';

let isSyncing = false;

/**
 * 检查当前是否有网络连接
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch {
    return false;
  }
}

/**
 * 执行单个同步操作
 */
async function executeSyncAction(action: SyncAction): Promise<boolean> {
  try {
    switch (action.type) {
      case 'create':
        await api.createCharacter(action.payload);
        break;
      case 'update':
        await api.updateCharacter(action.payload.id, action.payload.data);
        break;
      case 'delete':
        await api.deleteCharacter(action.payload.id);
        break;
      case 'adjustAffinity':
        await api.adjustAffinity(action.payload.characterId, action.payload.data);
        break;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * 处理同步队列，逐个执行离线操作
 * 返回是否全部成功
 */
export async function processSyncQueue(): Promise<boolean> {
  if (isSyncing) return false;
  isSyncing = true;

  try {
    const online = await isOnline();
    if (!online) return false;

    const queue = await loadSyncQueue();
    if (queue.length === 0) return true;

    const remaining: SyncAction[] = [];

    for (const action of queue) {
      const success = await executeSyncAction(action);
      if (!success) {
        remaining.push(action);
      }
    }

    if (remaining.length === 0) {
      await clearSyncQueue();
    } else {
      await saveSyncQueue(remaining);
    }

    return remaining.length === 0;
  } finally {
    isSyncing = false;
  }
}

/**
 * 获取待同步操作数量
 */
export async function getPendingSyncCount(): Promise<number> {
  const queue = await loadSyncQueue();
  return queue.length;
}
