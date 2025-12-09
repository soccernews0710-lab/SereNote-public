// src/activity/useActivityPresets.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ActivityCategory } from '../types/timeline';
import {
    type ActivityPreset,
    getDefaultActivityPresets,
    loadActivityPresets,
    saveActivityPresets,
} from './activityPresetStorage';

export type UseActivityPresetsResult = {
  presets: ActivityPreset[];
  loading: boolean;

  presetsByCategory: Record<ActivityCategory, ActivityPreset[]>;

  // 👇 引数を 3 つに変更
  addPreset: (
    category: ActivityCategory,
    label: string,
    defaultMinutes: number
  ) => void;
  updatePreset: (id: string, patch: Partial<ActivityPreset>) => void;
  deletePreset: (id: string) => void;
  // 👇 名前を resetPresets に統一
  resetPresets: () => void;
};

const allCategories: ActivityCategory[] = [
  'meal',
  'walk',
  'exercise',
  'rest',
  'nap',
  'work',
  'talk',
  'bath',
  'screen',
  'out',
  'other',
];

export const useActivityPresets = (): UseActivityPresetsResult => {
  const [presets, setPresets] = useState<ActivityPreset[]>([]);
  const [loading, setLoading] = useState(true);

  // 初回ロード
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const loaded = await loadActivityPresets();
        if (!cancelled) {
          setPresets(loaded);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 内部ヘルパー: set + save
  const setAndSave = useCallback(
    (updater: (prev: ActivityPreset[]) => ActivityPreset[]) => {
      setPresets(prev => {
        const next = updater(prev);
        saveActivityPresets(next).catch(e =>
          console.warn('Failed to persist activity presets', e)
        );
        return next;
      });
    },
    []
  );

  // ✅ 3 引数版 addPreset
  const addPreset = useCallback(
    (category: ActivityCategory, label: string, defaultMinutes: number) => {
      setAndSave(prev => [
        ...prev,
        {
          id: `preset-${category}-${Date.now()}`,
          category,
          label,
          emoji: '✅',
          defaultMinutes,
        },
      ]);
    },
    [setAndSave]
  );

  const updatePreset = useCallback(
    (id: string, patch: Partial<ActivityPreset>) => {
      setAndSave(prev =>
        prev.map(p => (p.id === id ? { ...p, ...patch, id: p.id } : p))
      );
    },
    [setAndSave]
  );

  const deletePreset = useCallback(
    (id: string) => {
      setAndSave(prev => prev.filter(p => p.id !== id));
    },
    [setAndSave]
  );

  // ✅ resetPresets にリネーム
  const resetPresets = useCallback(() => {
    const defaults = getDefaultActivityPresets();
    setPresets(defaults);
    saveActivityPresets(defaults).catch(e =>
      console.warn('Failed to reset activity presets', e)
    );
  }, []);

  const presetsByCategory = useMemo(() => {
    const map: Record<ActivityCategory, ActivityPreset[]> = {} as any;
    allCategories.forEach(c => {
      map[c] = [];
    });
    presets.forEach(p => {
      if (!map[p.category]) {
        map[p.category] = [];
      }
      map[p.category].push(p);
    });
    return map;
  }, [presets]);

  return {
    presets,
    loading,
    presetsByCategory,
    addPreset,
    updatePreset,
    deletePreset,
    resetPresets,
  };
};