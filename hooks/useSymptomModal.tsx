// hooks/useSymptomModal.tsx
import { useState } from 'react';
import type { TimelineEvent } from '../src/types/timeline';
import { getCurrentTimeString } from './utils/time';

export type SymptomModalMode = 'create' | 'edit';

type UseSymptomModalReturn = {
  visible: boolean;
  mode: SymptomModalMode;

  openModal: () => void;
  openForEdit: (event: TimelineEvent) => void;
  closeModal: () => void;

  labelText: string;
  setLabelText: (v: string) => void;

  memoText: string;
  setMemoText: (v: string) => void;

  timeText: string;
  setTimeText: (v: string) => void;

  confirmAndSubmit: (
    onSubmit: (event: TimelineEvent, mode: SymptomModalMode) => void
  ) => void;
};

export const useSymptomModal = (): UseSymptomModalReturn => {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<SymptomModalMode>('create');

  const [labelText, setLabelText] = useState('');
  const [memoText, setMemoText] = useState('');
  const [timeText, setTimeText] = useState('');

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEventTime, setEditingEventTime] = useState<string | null>(null);

  const openModal = () => {
    setMode('create');
    setEditingEventId(null);
    setEditingEventTime(null);
    setLabelText('');
    setMemoText('');
    setTimeText('');
    setVisible(true);
  };

  const openForEdit = (event: TimelineEvent) => {
    setMode('edit');
    setEditingEventId(event.id);
    setEditingEventTime(event.time || null);
    setLabelText(event.label);
    setMemoText(event.memo ?? '');
    setTimeText(event.time || '');
    setVisible(true);
  };

  const closeModal = () => setVisible(false);

  const confirmAndSubmit = (
    onSubmit: (event: TimelineEvent, mode: SymptomModalMode) => void
  ) => {
    const trimmedLabel = labelText.trim();
    const label = trimmedLabel.length > 0 ? trimmedLabel : '症状';

    const rawTime = timeText.trim();
    const time =
      rawTime !== ''
        ? rawTime
        : editingEventTime != null && editingEventTime !== ''
        ? editingEventTime
        : getCurrentTimeString();

    const id = editingEventId ?? `${Date.now()}`;

    const event: TimelineEvent = {
      id,
      time,
      type: 'symptom',
      label,
      planned: false,
      emoji: '😟',
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
    labelText,
    setLabelText,
    memoText,
    setMemoText,
    timeText,
    setTimeText,
    confirmAndSubmit,
  };
};