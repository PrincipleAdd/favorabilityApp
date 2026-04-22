/**
 * 本地持久化存储层
 * 使用 AsyncStorage 缓存人物和事件数据，支持离线使用
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Character, AffinityEvent } from '../types';

const KEYS = {
  CHARACTERS: '@affinity/characters',
  EVENTS_PREFIX: '@affinity/events/',
  SYNC_QUEUE: '@affinity/syncQueue',
};

// ============ 人物列表 ============

export async function saveCharactersLocal(characters: Character[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CHARACTERS, JSON.stringify(characters));
}

export async function loadCharactersLocal(): Promise<Character[]> {
  const raw = await AsyncStorage.getItem(KEYS.CHARACTERS);
  return raw ? JSON.parse(raw) : [];
}

// ============ 事件列表 ============

export async function saveEventsLocal(characterId: string, events: AffinityEvent[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.EVENTS_PREFIX + characterId, JSON.stringify(events));
}

export async function loadEventsLocal(characterId: string): Promise<AffinityEvent[]> {
  const raw = await AsyncStorage.getItem(KEYS.EVENTS_PREFIX + characterId);
  return raw ? JSON.parse(raw) : [];
}

// ============ 同步队列 ============

export interface SyncAction {
  id: string;
  type: 'create' | 'update' | 'delete' | 'adjustAffinity';
  payload: any;
  timestamp: number;
}

export async function loadSyncQueue(): Promise<SyncAction[]> {
  const raw = await AsyncStorage.getItem(KEYS.SYNC_QUEUE);
  return raw ? JSON.parse(raw) : [];
}

export async function saveSyncQueue(queue: SyncAction[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
}

export async function addToSyncQueue(action: SyncAction): Promise<void> {
  const queue = await loadSyncQueue();
  queue.push(action);
  await saveSyncQueue(queue);
}

export async function clearSyncQueue(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.SYNC_QUEUE);
}
