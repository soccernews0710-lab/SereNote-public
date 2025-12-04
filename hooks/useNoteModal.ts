// hooks/useNoteModal.tsx
import { useState } from 'react';
import type { TimelineEvent } from '../src/types/timeline';

export type NoteModalMode = 'create' | 'edit';

// "HH:MM" を現在時刻から作る
const getCurrentTimeString = () => {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

type UseNoteModalReturn = {
  visible: boolean;
  mode: NoteModalMode;

  openForCreate: () => void;
  openForEdit: (event: TimelineEvent) => void;

  closeModal: () => void;

  noteText: string;
  setNoteText: (v: string) => void;

  timeText: string;
  setTimeText: (v: string) => void;

  confirmAndSubmit: (
    onSubmit: (event: TimelineEvent, mode: NoteModalMode) => void
  ) => void;
};

export const useNoteModal = (): UseNoteModalReturn => {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<NoteModalMode>('create');

  const [noteText, setNoteText] = useState('');
  const [timeText, setTimeText] = useState('');

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEventTime, setEditingEventTime] = useState<string | null>(null);

  const openForCreate = () => {
    setMode('create');
    setEditingEventId(null);
    setEditingEventTime(null);
    setNoteText('');
    setTimeText('');
    setVisible(true);
  };

  const openForEdit = (event: TimelineEvent) => {
    setMode('edit');
    setEditingEventId(event.id);
    setEditingEventTime(event.time || null);
    setNoteText(event.label);
    setTimeText(event.time || '');
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
  };

  const confirmAndSubmit = (
    onSubmit: (event: TimelineEvent, mode: NoteModalMode) => void
  ) => {
    const trimmed = noteText.trim();
    const label = trimmed || 'メモ';

    const rawTime = timeText.trim();
    const time =
      rawTime !== ''
        ? rawTime
        : editingEventTime != null && editingEventTime !== ''
        ? editingEventTime
        : getCurrentTimeString();

    const id = editingEventId ?? `${Date.now()}`;

    const newEvent: TimelineEvent = {
      id,
      time,
      type: 'note',
      label,
      planned: false,
      emoji: '📝',
      memo: undefined,
    };

    onSubmit(newEvent, mode);
    setVisible(false);
  };

  return {
    visible,
    mode,
    openForCreate,
    openForEdit,
    closeModal,
    noteText,
    setNoteText,
    timeText,
    setTimeText,
    confirmAndSubmit,
  };
};