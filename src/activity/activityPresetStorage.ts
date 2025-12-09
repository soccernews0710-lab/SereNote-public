// src/activity/activityPresetStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ActivityCategory } from '../../src/types/timeline';
export type ActivityPreset = {
  id: string;
  category: ActivityCategory;
  label: string;        // 例: 「朝ごはん」
  emoji: string;        // 例: 🍚
  defaultMinutes?: number; // デフォルトの時間（分） 任意
};

const STORAGE_KEY = 'serenote:activityPresets';

// デフォルトのプリセット一覧
export const getDefaultActivityPresets = (): ActivityPreset[] => [
  // meal
  {
    id: 'meal-breakfast',
    category: 'meal',
    label: '朝ごはん',
    emoji: '🍞',
    defaultMinutes: 20,
  },
  {
    id: 'meal-lunch',
    category: 'meal',
    label: '昼ごはん',
    emoji: '🍱',
    defaultMinutes: 30,
  },
  {
    id: 'meal-dinner',
    category: 'meal',
    label: '夜ごはん',
    emoji: '🍚',
    defaultMinutes: 30,
  },

  // walk / exercise
  {
    id: 'walk-short',
    category: 'walk',
    label: '近所を散歩',
    emoji: '🚶‍♂️',
    defaultMinutes: 20,
  },
  {
    id: 'exercise-light',
    category: 'exercise',
    label: '軽い運動',
    emoji: '🤸‍♂️',
    defaultMinutes: 15,
  },

  // rest / nap
  {
    id: 'rest-lie-down',
    category: 'rest',
    label: '横になって休憩',
    emoji: '🛏️',
    defaultMinutes: 20,
  },
  {
    id: 'nap-short',
    category: 'nap',
    label: '短い昼寝',
    emoji: '😴',
    defaultMinutes: 20,
  },

  // work / study
  {
    id: 'work-focus',
    category: 'work',
    label: '集中して作業',
    emoji: '💻',
    defaultMinutes: 30,
  },

  // talk
  {
    id: 'talk-friend',
    category: 'talk',
    label: '友達と話す',
    emoji: '🗣️',
    defaultMinutes: 30,
  },

  // bath
  {
    id: 'bath-normal',
    category: 'bath',
    label: 'お風呂に入る',
    emoji: '🛁',
    defaultMinutes: 20,
  },

  // screen
  {
    id: 'screen-phone',
    category: 'screen',
    label: 'スマホを触る',
    emoji: '📱',
    defaultMinutes: 30,
  },

  // out
  {
    id: 'out-shopping',
    category: 'out',
    label: '買い物に出る',
    emoji: '🛒',
    defaultMinutes: 40,
  },

  // other
  {
    id: 'other-free',
    category: 'other',
    label: 'その他の行動',
    emoji: '✅',
  },
];

export async function loadActivityPresets(): Promise<ActivityPreset[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultActivityPresets();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return getDefaultActivityPresets();
    }
    return parsed as ActivityPreset[];
  } catch (e) {
    console.warn('Failed to load activity presets', e);
    return getDefaultActivityPresets();
  }
}

export async function saveActivityPresets(
  presets: ActivityPreset[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (e) {
    console.warn('Failed to save activity presets', e);
  }
}