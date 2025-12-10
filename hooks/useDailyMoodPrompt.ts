// hooks/useDailyMoodPrompt.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import type { DateKey } from '../src/types/serenote';

// 朝と午後それぞれ別のキーで管理
const STORAGE_KEY_MORNING = 'serenote_mood_prompt_morning';
const STORAGE_KEY_AFTERNOON = 'serenote_mood_prompt_afternoon';

/**
 * その日の最初の起動（＋午後の最初の起動）で
 * 「気分モーダルを自動で出すべきか？」を判定するフック
 *
 * Free / Pro 共通で
 * - 午前中：その日初めてアプリを開いたタイミングで 1 回
 * - 午後：その日初めて午後に開いたタイミングで 1 回
 * だけ true を返す。
 */
export function useDailyMoodPrompt(dateKey: DateKey) {
  const [shouldAutoOpenMood, setShouldAutoOpenMood] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const todayKey: DateKey = `${y}-${m}-${d}`;

        // 「今日の画面」でないなら何もしない
        if (dateKey !== todayKey) return;

        const hour = now.getHours();
        const isMorning = hour < 12; // ← 午前/午後の境目（必要なら 13 や 14 に変えてOK）

        if (isMorning) {
          const last = await AsyncStorage.getItem(STORAGE_KEY_MORNING);
          if (!cancelled && last !== todayKey) {
            setShouldAutoOpenMood(true);
            await AsyncStorage.setItem(STORAGE_KEY_MORNING, todayKey);
          }
        } else {
          const last = await AsyncStorage.getItem(STORAGE_KEY_AFTERNOON);
          if (!cancelled && last !== todayKey) {
            setShouldAutoOpenMood(true);
            await AsyncStorage.setItem(STORAGE_KEY_AFTERNOON, todayKey);
          }
        }
      } catch (e) {
        // 失敗したら何もしない（自動プロンプトオフ扱い）
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  return {
    shouldAutoOpenMood,
    setShouldAutoOpenMood,
  };
}