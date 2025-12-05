// hooks/useSymptomModal.tsx
import { useState } from 'react';
import type { TimelineEvent } from '../src/types/timeline';

export type SymptomModalMode = 'create' | 'edit';

type UseSymptomModalReturn = {
  visible: boolean;
  mode: SymptomModalMode;
  openModal: () => void;
  openForEdit: (event: TimelineEvent) => void;
  closeModal: () => void;
  confirmAndSubmit: (
    onSubmit: (event: TimelineEvent, mode: SymptomModalMode) => void
  ) => void;

  labelText: string;
  setLabelText: (v: string) => void;

  memoText: string;
  setMemoText: (v: string) => void;

  timeText: string;
  setTimeText: (v: string) => void;

  // 🩺 診察で話したいフラグ
  forDoctor: boolean;
  setForDoctor: (v: boolean) => void;
};

// "HH:MM" 形式に揃える（空や変な値なら「現在時刻」にする）
const buildTimeString = (raw: string): string => {
  if (raw && /^\d{2}:\d{2}$/.test(raw)) {
    return raw;
  }
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
};

export function useSymptomModal(): UseSymptomModalReturn {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<SymptomModalMode>('create');
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);

  const [labelText, setLabelText] = useState('');
  const [memoText, setMemoText] = useState('');
  const [timeText, setTimeText] = useState('');
  const [forDoctor, setForDoctor] = useState(false);

  // 新規作成モードで開く
  const openModal = () => {
    setMode('create');
    setEditingEvent(null);
    setLabelText('');
    setMemoText('');
    setTimeText('');
    setForDoctor(false);
    setVisible(true);
  };

  // 既存イベント編集モードで開く
  const openForEdit = (event: TimelineEvent) => {
    setMode('edit');
    setEditingEvent(event);
    setLabelText(event.label ?? '');
    setMemoText(event.memo ?? '');
    setTimeText(event.time ?? '');
    setForDoctor(!!event.forDoctor);
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
  };

  const confirmAndSubmit = (
    onSubmit: (event: TimelineEvent, mode: SymptomModalMode) => void
  ) => {
    const trimmedLabel = labelText.trim() || '症状';
    const trimmedMemo = memoText.trim() || undefined;
    const time = buildTimeString(timeText);

    let newEvent: TimelineEvent;

    if (mode === 'edit' && editingEvent) {
      newEvent = {
        ...editingEvent,
        label: trimmedLabel,
        memo: trimmedMemo,
        time,
        forDoctor,
      };
    } else {
      newEvent = {
        id: `symptom_${Date.now()}`,
        type: 'symptom',
        time,
        label: trimmedLabel,
        memo: trimmedMemo,
        forDoctor,
        planned: false,
      };
    }

    onSubmit(newEvent, mode);
    closeModal();
  };

  return {
    visible,
    mode,
    openModal,
    openForEdit,
    closeModal,
    confirmAndSubmit,
    labelText,
    setLabelText,
    memoText,
    setMemoText,
    timeText,
    setTimeText,
    forDoctor,
    setForDoctor,
  };
}