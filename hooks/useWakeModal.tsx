// hooks/useWakeModal.tsx
import { useState } from 'react';
import type { TimelineEvent } from '../src/types/timeline';
import { getCurrentTimeString } from './utils/time';

// "HH:MM" を軽くバリデーションして正規化
const normalizeTimeString = (input: string): string | null => {
  const trimmed = input.trim();
  const match = trimmed.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const h = hour.toString().padStart(2, '0');
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m}`;
};

type UseWakeModalReturn = {
  visible: boolean;
  openModal: () => void;
  closeModal: () => void;

  timeText: string;
  setTimeText: (v: string) => void;

  memoText: string;
  setMemoText: (v: string) => void;

  // Today 側から handleAddOrUpdateWake を渡す
  confirmAndCreateEvent: (onAdd: (event: TimelineEvent) => void) => void;
};

export const useWakeModal = (): UseWakeModalReturn => {
  const [visible, setVisible] = useState(false);
  const [timeText, setTimeText] = useState('');
  const [memoText, setMemoText] = useState('');

  // ☆ 新規でも編集でも使う。内容のリセットは呼び出し側でやる
  //   （+起床のときは Today 側で timeText/memoText を空にしてから呼ぶ）
  const openModal = () => {
    setVisible(true);
  };

  const closeModal = () => setVisible(false);

  const confirmAndCreateEvent = (onAdd: (event: TimelineEvent) => void) => {
    // TimePicker から来た値を優先しつつ、空/変なら現在時刻
    const normalized = normalizeTimeString(timeText);
    const time = normalized ?? getCurrentTimeString();

    const event: TimelineEvent = {
      id: `${Date.now()}`,
      time,
      type: 'wake',
      label: '起床',
      planned: false,
      emoji: '🌅',
      memo: memoText.trim() || undefined,
    };

    onAdd(event);
    setVisible(false);
  };

  return {
    visible,
    openModal,
    closeModal,
    timeText,
    setTimeText,
    memoText,
    setMemoText,
    confirmAndCreateEvent,
  };
};