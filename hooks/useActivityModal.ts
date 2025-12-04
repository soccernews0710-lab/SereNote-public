// hooks/useActivityModal.tsx
import { useState } from 'react';
import type { TimelineEvent } from '../src/types/timeline';
import { getCurrentTimeString } from './utils/time';

// 行動カテゴリ
export type ActivityCategory = 'meal' | 'walk' | 'talk' | 'bath' | 'other';

// モーダルのモード
export type ActivityModalMode = 'create' | 'edit';

type UseActivityModalReturn = {
  visible: boolean;
  mode: ActivityModalMode;

  // 新規用
  openModal: () => void;
  // 編集用
  openForEdit: (event: TimelineEvent) => void;

  closeModal: () => void;

  category: ActivityCategory;
  setCategory: (c: ActivityCategory) => void;

  labelText: string;
  setLabelText: (v: string) => void;

  memoText: string;
  setMemoText: (v: string) => void;

  timeText: string;
  setTimeText: (v: string) => void;

  confirmAndSubmit: (
    onSubmit: (event: TimelineEvent, mode: ActivityModalMode) => void
  ) => void;
};

export const useActivityModal = (): UseActivityModalReturn => {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<ActivityModalMode>('create');

  const [category, setCategory] = useState<ActivityCategory>('meal');
  const [labelText, setLabelText] = useState('');
  const [memoText, setMemoText] = useState('');
  const [timeText, setTimeText] = useState('');

  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // 新規
  const openModal = () => {
    setMode('create');
    setEditingEventId(null);

    setCategory('meal');
    setLabelText('');
    setMemoText('');
    // ⭐ 開いた瞬間の「今の時刻」をセット
    setTimeText(getCurrentTimeString());

    setVisible(true);
  };

  // 編集
  const openForEdit = (event: TimelineEvent) => {
    setMode('edit');
    setEditingEventId(event.id);

    const emoji = event.emoji ?? '';
    if (emoji === '🍚') {
      setCategory('meal');
    } else if (emoji === '🚶‍♂️' || emoji === '🏃‍♂️') {
      setCategory('walk');
    } else if (emoji === '🗣️') {
      setCategory('talk');
    } else if (emoji === '🛁') {
      setCategory('bath');
    } else {
      setCategory('other');
    }

    setLabelText(event.label);
    setMemoText(event.memo ?? '');
    // ⭐ 元のイベントの時刻をそのまま反映
    setTimeText(event.time || getCurrentTimeString());

    setVisible(true);
  };

  const closeModal = () => setVisible(false);

  // カテゴリ → デフォルトラベル & 絵文字
  const buildBaseLabelAndEmoji = (): { baseLabel: string; emoji: string } => {
    switch (category) {
      case 'meal':
        return { baseLabel: 'ごはん', emoji: '🍚' };
      case 'walk':
        return { baseLabel: '散歩', emoji: '🚶‍♂️' };
      case 'talk':
        return { baseLabel: '会話', emoji: '🗣️' };
      case 'bath':
        return { baseLabel: 'お風呂', emoji: '🛁' };
      default:
        return { baseLabel: '行動', emoji: '✅' };
    }
  };

  const confirmAndSubmit = (
    onSubmit: (event: TimelineEvent, mode: ActivityModalMode) => void
  ) => {
    const { baseLabel, emoji } = buildBaseLabelAndEmoji();

    const trimmedLabel = labelText.trim();
    const label = trimmedLabel.length > 0 ? trimmedLabel : baseLabel;

    const rawTime = timeText.trim();
    const time = rawTime !== '' ? rawTime : getCurrentTimeString();

    const id = editingEventId ?? `${Date.now()}`;

    const event: TimelineEvent = {
      id,
      time,
      type: 'activity',
      label,
      planned: false,
      emoji,
      memo: memoText.trim() || undefined,
    };

    onSubmit(event, mode);
    setVisible(false);
  };

  return {
    visible,
    mode,
    openModal,
    openForEdit,
    closeModal,
    category,
    setCategory,
    labelText,
    setLabelText,
    memoText,
    setMemoText,
    timeText,
    setTimeText,
    confirmAndSubmit,
  };
};