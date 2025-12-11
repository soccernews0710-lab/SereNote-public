// hooks/useMoodModal.tsx
import { useState } from 'react';
import type { SerenoteMoodValue } from '../src/types/serenote';
import type { TimelineEvent } from '../src/types/timeline';

// 5段階の気分スコア（1〜5）
// 1: とてもつらい
// 2: つらい
// 3: ふつう
// 4: 少し良い
// 5: とても良い
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
  // デフォルトは「3: ふつう」
  const [mood, setMood] = useState<MoodValue>(3);
  const [memoText, setMemoText] = useState('');
  const [timeText, setTimeText] = useState('');

  const openModal = () => {
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
  };

  // 気分スコア(1〜5) → ラベル & 絵文字
  const buildMoodLabelAndEmoji = (): { label: string; emoji: string } => {
    switch (mood) {
      case 1:
        return { label: 'とてもつらい', emoji: '😭' };
      case 2:
        return { label: 'つらい', emoji: '😣' };
      case 3:
        return { label: 'ふつう', emoji: '😐' };
      case 4:
        return { label: '少し良い', emoji: '🙂' };
      case 5:
      default:
        return { label: 'とても良い', emoji: '😄' };
    }
  };

  const confirmAndCreateEvent = (onAdd: (event: TimelineEvent) => void) => {
    const { label, emoji } = buildMoodLabelAndEmoji();

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
      // 🆕 1〜5 の moodValue をそのまま保存
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