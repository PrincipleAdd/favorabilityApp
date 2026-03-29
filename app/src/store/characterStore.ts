import { create } from 'zustand';
import type {
  Character,
  AffinityEvent,
  CreateCharacterRequest,
  UpdateCharacterRequest,
  AdjustAffinityRequest,
} from '../types';
import * as api from '../api/client';

/** Store 状态类型 */
export interface CharacterState {
  /** 人物列表 */
  characters: Character[];
  /** 当前查看的人物 */
  currentCharacter: Character | null;
  /** 当前人物的事件列表 */
  events: AffinityEvent[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;

  /** 获取人物列表 */
  fetchCharacters: () => Promise<void>;
  /** 创建人物 */
  createCharacter: (req: CreateCharacterRequest) => Promise<Character>;
  /** 更新人物信息 */
  updateCharacter: (id: string, req: UpdateCharacterRequest) => Promise<void>;
  /** 删除人物 */
  deleteCharacter: (id: string) => Promise<void>;
  /** 调整好感度 */
  adjustAffinity: (id: string, req: AdjustAffinityRequest) => Promise<void>;
  /** 获取人物好感度事件列表 */
  fetchEvents: (id: string) => Promise<void>;
  /** 设置当前人物 */
  setCurrentCharacter: (character: Character | null) => void;
  /** 清除错误 */
  clearError: () => void;
}

/**
 * 从错误对象中提取可读的错误信息
 */
function extractErrorMessage(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'isAxiosError' in err &&
    (err as any).isAxiosError
  ) {
    const axiosErr = err as any;
    if (axiosErr.response?.data?.error) {
      return axiosErr.response.data.error;
    }
    if (axiosErr.message) {
      return axiosErr.message;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return '未知错误';
}

export const useCharacterStore = create<CharacterState>()((set, get) => ({
  characters: [],
  currentCharacter: null,
  events: [],
  loading: false,
  error: null,

  fetchCharacters: async () => {
    set({ loading: true, error: null });
    try {
      const characters = await api.getCharacters();
      set({ characters });
    } catch (err) {
      set({ error: extractErrorMessage(err) });
    } finally {
      set({ loading: false });
    }
  },

  createCharacter: async (req: CreateCharacterRequest) => {
    set({ loading: true, error: null });
    try {
      const character = await api.createCharacter(req);
      set((state) => ({ characters: [character, ...state.characters] }));
      return character;
    } catch (err) {
      set({ error: extractErrorMessage(err) });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateCharacter: async (id: string, req: UpdateCharacterRequest) => {
    set({ loading: true, error: null });
    try {
      const updated = await api.updateCharacter(id, req);
      set((state) => ({
        characters: state.characters.map((c) => (c.id === id ? updated : c)),
        currentCharacter:
          state.currentCharacter?.id === id ? updated : state.currentCharacter,
      }));
    } catch (err) {
      set({ error: extractErrorMessage(err) });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteCharacter: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.deleteCharacter(id);
      set((state) => ({
        characters: state.characters.filter((c) => c.id !== id),
        currentCharacter:
          state.currentCharacter?.id === id ? null : state.currentCharacter,
        events: state.currentCharacter?.id === id ? [] : state.events,
      }));
    } catch (err) {
      set({ error: extractErrorMessage(err) });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  adjustAffinity: async (id: string, req: AdjustAffinityRequest) => {
    set({ loading: true, error: null });
    try {
      const result = await api.adjustAffinity(id, req);
      set((state) => ({
        characters: state.characters.map((c) =>
          c.id === id ? { ...c, affinity: result.affinity } : c,
        ),
        currentCharacter:
          state.currentCharacter?.id === id
            ? { ...state.currentCharacter, affinity: result.affinity }
            : state.currentCharacter,
        events:
          state.currentCharacter?.id === id
            ? [
                { ...result.event, characterId: id } as AffinityEvent,
                ...state.events,
              ]
            : state.events,
      }));
    } catch (err) {
      set({ error: extractErrorMessage(err) });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  fetchEvents: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const events = await api.getEvents(id);
      set({ events });
    } catch (err) {
      set({ error: extractErrorMessage(err) });
    } finally {
      set({ loading: false });
    }
  },

  setCurrentCharacter: (character: Character | null) => {
    set({ currentCharacter: character });
  },

  clearError: () => {
    set({ error: null });
  },
}));
