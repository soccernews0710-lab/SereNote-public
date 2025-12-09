// hooks/useActivityModal.tsx
import { useState } from 'react';
import type {
  ActivityCategory,
  TimelineEvent,
} from '../src/types/timeline';
import { ACTIVITY_CATEGORY_META } from '../src/types/timeline';
import { getCurrentTimeString } from './utils/time';

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

  // 🌟 追加：終了時間
  endTimeText: string;
  setEndTimeText: (v: string) => void;

  confirmAndSubmit: (
    onSubmit: (event: TimelineEvent, mode: ActivityModalMode) => void
  ) => void;
};

export const useActivityModal = (): UseActivityModalReturn => {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<ActivityModalMode>('create');

  const [category, setCategory] =
    useState<ActivityCategory>('meal');
  const [labelText, setLabelText] = useState('');
  const [memoText, setMemoText] = useState('');
  const [timeText, setTimeText] = useState('');
  const [endTimeText, setEndTimeText] = useState('');

  const [editingEventId, setEditingEventId] =
    useState<string | null>(null);

  // 新規
  const openModal = () => {
    setMode('create');
    setEditingEventId(null);

    setCategory('meal');
    setLabelText('');
    setMemoText('');
    setTimeText(getCurrentTimeString());
    setEndTimeText(''); // 終了時間はデフォルト空

    setVisible(true);
  };

  // 編集
  const openForEdit = (event: TimelineEvent) => {
    setMode('edit');
    setEditingEventId(event.id);

    if (event.category) {
      setCategory(event.category);
    } else {
      // 互換用：emoji から推定（古いデータ）
      const emoji = event.emoji ?? '';
      if (emoji === '🍚') setCategory('meal');
      else if (emoji === '🚶‍♂️' || emoji === '🏃‍♂️')
        setCategory('walk');
      else if (emoji === '🗣️') setCategory('talk');
      else if (emoji === '🛁') setCategory('bath');
      else setCategory('other');
    }

    setLabelText(event.label);
    setMemoText(event.memo ?? '');
    setTimeText(event.time || getCurrentTimeString());
    setEndTimeText(event.endTime ?? '');

    setVisible(true);
  };

  const closeModal = () => setVisible(false);

  const confirmAndSubmit = (
    onSubmit: (event: TimelineEvent, mode: ActivityModalMode) => void
  ) => {
    const meta = ACTIVITY_CATEGORY_META[category];

    const trimmedLabel = labelText.trim();
    const label =
      trimmedLabel.length > 0 ? trimmedLabel : meta.label;

    const rawTime = timeText.trim();
    const time = rawTime !== '' ? rawTime : getCurrentTimeString();

    const rawEnd = endTimeText.trim();
    const endTime = rawEnd !== '' ? rawEnd : undefined;

    const id = editingEventId ?? `${Date.now()}`;

    const event: TimelineEvent = {
      id,
      time,
      endTime,
      type: 'activity',
      label,
      planned: false,
      emoji: meta.emoji,
      category,
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
    endTimeText,
    setEndTimeText,
    confirmAndSubmit,
  };
};