// hooks/useMoodModal.tsx
import { useState } from 'react';
import type { TimelineEvent } from '../src/types/timeline';

// 5段階の気分スコア
// -2: とてもつらい
// -1: つらい
//  0: ふつう
//  1: 少し良い
//  2: とても良い
export type MoodValue = -2 | -1 | 0 | 1 | 2;

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
  const [mood, setMood] = useState<MoodValue>(0);
  const [memoText, setMemoText] = useState('');
  const [timeText, setTimeText] = useState('');

  const openModal = () => {
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
  };

  // 気分スコア → ラベル & 絵文字
  const buildMoodLabelAndEmoji = (): { label: string; emoji: string } => {
    switch (mood) {
      case -2:
        return { label: 'とてもつらい', emoji: '😭' };
      case -1:
        return { label: 'つらい', emoji: '😣' };
      case 0:
        return { label: 'ふつう', emoji: '😐' };
      case 1:
        return { label: '少し良い', emoji: '🙂' };
      case 2:
      default:
        return { label: 'とても良い', emoji: '😄' };
    }
  };

  const confirmAndCreateEvent = (onAdd: (event: TimelineEvent) => void) => {
    const { label, emoji } = buildMoodLabelAndEmoji();

    const rawTime = timeText.trim();
    const time = rawTime !== '' ? rawTime : getCurrentTimeString();

    const newEvent: TimelineEvent = {
      id: `${Date.now()}`,
      time,
      type: 'mood',
      label,
      planned: false,
      emoji,
      memo: memoText.trim() || undefined,
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