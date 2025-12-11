// hooks/useMoodModal.tsx
import { useState } from 'react';
import type { SerenoteMoodValue } from '../src/types/mood';
import type { TimelineEvent } from '../src/types/timeline';
import { describeMood } from '../src/utils/mood';

/**
 * 気分スコア（-2〜+2）
 * -2: とてもつらい
 * -1: つらい
 *  0: ふつう
 *  1: 少し良い
 *  2: とても良い
 *
 * 👉 型は SerenoteMoodValue をそのまま使う
 */
export type MoodValue = SerenoteMoodValue;

// "HH:MM" を現在時刻から作る
const getCurrentTimeString = () => {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

type UseMoodModalReturn = {
  visible: boolean;
  openModal: () => void;
  closeModal: () => void;

  mood: MoodValue;
  setMood: (v: MoodValue) => void;

  memoText: string;
  setMemoText: (v: string) => void;

  timeText: string;
  setTimeText: (v: string) => void;

  // 「追加する」押したとき、TimelineEvent を親に返す
  confirmAndCreateEvent: (onAdd: (event: TimelineEvent) => void) => void;
};

export const useMoodModal = (): UseMoodModalReturn => {
  const [visible, setVisible] = useState(false);
  // デフォルトは「ふつう」= 0
  const [mood, setMood] = useState<MoodValue>(0);
  const [memoText, setMemoText] = useState('');
  const [timeText, setTimeText] = useState('');

  const openModal = () => {
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
  };

  const confirmAndCreateEvent = (onAdd: (event: TimelineEvent) => void) => {
    // 🌟 ユーティリティに寄せる
    const { label, emoji } = describeMood(mood);

    const rawTime = timeText.trim();
    const time = rawTime !== '' ? rawTime : getCurrentTimeString();

    const newEvent: TimelineEvent = {
      id:
        typeof globalThis !== 'undefined' &&
        (globalThis as any).crypto &&
        typeof (globalThis as any).crypto.randomUUID === 'function'
          ? (globalThis as any).crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      time,
      type: 'mood',
      label,
      planned: false,
      emoji,
      memo: memoText.trim() || undefined,
      // 🌟 正規形として -2〜+2 の moodValue を保存
      moodValue: mood,
    };

    onAdd(newEvent);
    setVisible(false);
  };

  return {
    visible,
    openModal,
    closeModal,
    mood,
    setMood,
    memoText,
    setMemoText,
    timeText,
    setTimeText,
    confirmAndCreateEvent,
  };
};