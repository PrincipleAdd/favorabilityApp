import { create } from 'zustand';
import type {
  Character,
  AffinityEvent,
  CreateCharacterRequest,
  UpdateCharacterRequest,
  AdjustAffinityRequest,
} from '../types';
import * as api from '../api/client';
import {
  saveCharactersLocal,
  loadCharactersLocal,
  saveEventsLocal,
  loadEventsLocal,
  addToSyncQueue,
  type SyncAction,
} from './localStorage';
import { isOnline, processSyncQueue } from './syncManager';

export interface CharacterState {
  characters: Character[];
  currentCharacter: Character | null;
  events: AffinityEvent[];
  loading: boolean;
  error: string | null;
  /** 是否离线模式 */
  offline: boolean;
  /** 待同步操作数 */
  pendingSync: number;

  fetchCharacters: () => Promise<void>;
  createCharacter: (req: CreateCharacterRequest) => Promise<Character>;
  updateCharacter: (id: string, req: UpdateCharacterRequest) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  adjustAffinity: (id: string, req: AdjustAffinityRequest) => Promise<void>;
  fetchEvents: (id: string) => Promise<void>;
  setCurrentCharacter: (character: Character | null) => void;
  clearError: () => void;
  /** 尝试同步离线数据 */
  syncOfflineData: () => Promise<void>;
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'isAxiosError' in err) {
    const a = err as any;
    return a.response?.data?.error ?? a.message ?? '网络错误';
  }
  return err instanceof Error ? err.message : '未知错误';
}

function generateLocalId(): string {
  return 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

function clampAffinity(current: number, delta: number): number {
  return Math.max(-100, Math.min(100, current + delta));
}

export const useCharacterStore = create<CharacterState>()((set, get) => ({
  characters: [],
  currentCharacter: null,
  events: [],
  loading: false,
  error: null,
  offline: false,
  pendingSync: 0,

  fetchCharacters: async () => {
    set({ loading: true, error: null });
    const online = await isOnline();

    if (online) {
      // 先尝试同步离线数据
      await processSyncQueue();
      try {
        const characters = await api.getCharacters();
        set({ characters, offline: false, pendingSync: 0 });
        await saveCharactersLocal(characters);
        return;
      } catch { /* fall through to local */ }
    }

    // 离线或请求失败，从本地加载
    const local = await loadCharactersLocal();
    set({ characters: local, offline: true, loading: false });
  },

  createCharacter: async (req: CreateCharacterRequest) => {
    set({ loading: true, error: null });
    const online = await isOnline();

    if (online) {
      try {
        const character = await api.createCharacter(req);
        set((s) => ({ characters: [character, ...s.characters] }));
        await saveCharactersLocal(get().characters);
        return character;
      } catch (err) {
        set({ error: extractErrorMessage(err) });
        throw err;
      } finally {
        set({ loading: false });
      }
    }

    // 离线：本地创建
    const localChar: Character = {
      id: generateLocalId(),
      name: req.name,
      avatar: req.avatar,
      note: req.note,
      affinity: 60,
      createdAt: new Date().toISOString(),
    };
    const action: SyncAction = {
      id: localChar.id,
      type: 'create',
      payload: req,
      timestamp: Date.now(),
    };
    await addToSyncQueue(action);
    set((s) => ({
      characters: [localChar, ...s.characters],
      offline: true,
      pendingSync: s.pendingSync + 1,
      loading: false,
    }));
    await saveCharactersLocal(get().characters);
    return localChar;
  },

  updateCharacter: async (id: string, req: UpdateCharacterRequest) => {
    set({ loading: true, error: null });
    const online = await isOnline();

    if (online) {
      try {
        const updated = await api.updateCharacter(id, req);
        set((s) => ({
          characters: s.characters.map((c) => (c.id === id ? updated : c)),
          currentCharacter: s.currentCharacter?.id === id ? updated : s.currentCharacter,
        }));
        await saveCharactersLocal(get().characters);
      } catch (err) {
        set({ error: extractErrorMessage(err) });
        throw err;
      } finally {
        set({ loading: false });
      }
      return;
    }

    // 离线：本地更新
    set((s) => {
      const chars = s.characters.map((c) =>
        c.id === id ? { ...c, ...req, name: req.name ?? c.name } : c,
      );
      const cur = s.currentCharacter?.id === id
        ? { ...s.currentCharacter, ...req, name: req.name ?? s.currentCharacter.name }
        : s.currentCharacter;
      return { characters: chars, currentCharacter: cur, loading: false, offline: true, pendingSync: s.pendingSync + 1 };
    });
    await addToSyncQueue({ id: generateLocalId(), type: 'update', payload: { id, data: req }, timestamp: Date.now() });
    await saveCharactersLocal(get().characters);
  },

  deleteCharacter: async (id: string) => {
    set({ loading: true, error: null });
    const online = await isOnline();

    if (online) {
      try {
        await api.deleteCharacter(id);
      } catch (err) {
        set({ error: extractErrorMessage(err) });
        throw err;
      }
    } else {
      await addToSyncQueue({ id: generateLocalId(), type: 'delete', payload: { id }, timestamp: Date.now() });
    }

    set((s) => ({
      characters: s.characters.filter((c) => c.id !== id),
      currentCharacter: s.currentCharacter?.id === id ? null : s.currentCharacter,
      events: s.currentCharacter?.id === id ? [] : s.events,
      loading: false,
      offline: !online ? true : s.offline,
      pendingSync: !online ? s.pendingSync + 1 : s.pendingSync,
    }));
    await saveCharactersLocal(get().characters);
  },

  adjustAffinity: async (id: string, req: AdjustAffinityRequest) => {
    set({ loading: true, error: null });
    const online = await isOnline();

    if (online) {
      try {
        const result = await api.adjustAffinity(id, req);
        set((s) => ({
          characters: s.characters.map((c) => (c.id === id ? { ...c, affinity: result.affinity } : c)),
          currentCharacter: s.currentCharacter?.id === id
            ? { ...s.currentCharacter, affinity: result.affinity } : s.currentCharacter,
          events: s.currentCharacter?.id === id
            ? [{ ...result.event, characterId: id } as AffinityEvent, ...s.events] : s.events,
        }));
        await saveCharactersLocal(get().characters);
        if (get().currentCharacter?.id === id) {
          await saveEventsLocal(id, get().events);
        }
      } catch (err) {
        set({ error: extractErrorMessage(err) });
        throw err;
      } finally {
        set({ loading: false });
      }
      return;
    }

    // 离线：本地调整
    const char = get().characters.find((c) => c.id === id);
    if (!char) { set({ loading: false }); return; }

    const newAffinity = clampAffinity(char.affinity, req.delta);
    const localEvent: AffinityEvent = {
      id: generateLocalId(),
      characterId: id,
      delta: req.delta,
      affinityAfter: newAffinity,
      reason: req.reason,
      createdAt: new Date().toISOString(),
    };

    await addToSyncQueue({ id: generateLocalId(), type: 'adjustAffinity', payload: { characterId: id, data: req }, timestamp: Date.now() });
    set((s) => ({
      characters: s.characters.map((c) => (c.id === id ? { ...c, affinity: newAffinity } : c)),
      currentCharacter: s.currentCharacter?.id === id
        ? { ...s.currentCharacter, affinity: newAffinity } : s.currentCharacter,
      events: s.currentCharacter?.id === id ? [localEvent, ...s.events] : s.events,
      loading: false,
      offline: true,
      pendingSync: s.pendingSync + 1,
    }));
    await saveCharactersLocal(get().characters);
    if (get().currentCharacter?.id === id) {
      await saveEventsLocal(id, get().events);
    }
  },

  fetchEvents: async (id: string) => {
    set({ loading: true, error: null });
    const online = await isOnline();

    if (online) {
      try {
        const events = await api.getEvents(id);
        set({ events });
        await saveEventsLocal(id, events);
        return;
      } catch { /* fall through */ }
    }

    const local = await loadEventsLocal(id);
    set({ events: local, loading: false, offline: true });
  },

  setCurrentCharacter: (character: Character | null) => {
    set({ currentCharacter: character });
  },

  clearError: () => {
    set({ error: null });
  },

  syncOfflineData: async () => {
    const online = await isOnline();
    if (!online) return;

    const allSynced = await processSyncQueue();
    if (allSynced) {
      // 同步成功后从服务器拉取最新数据
      try {
        const characters = await api.getCharacters();
        set({ characters, offline: false, pendingSync: 0 });
        await saveCharactersLocal(characters);
      } catch { /* ignore */ }
    }
  },
}));
