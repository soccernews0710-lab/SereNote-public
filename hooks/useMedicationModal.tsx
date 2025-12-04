// hooks/useMedicationModal.tsx
import { useState } from 'react';
import type {
  MedTimeSlot,
  TimelineEvent,
  UserMedication,
} from '../src/types/timeline';

export type TimeMode = 'now' | 'manual';

// "HH:MM" を現在時刻から作る
const getCurrentTimeString = () => {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

// "HH:MM" 形式のざっくりバリデーション
const normalizeTimeString = (input: string): string | null => {
  const trimmed = input.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  let minute = parseInt(match[2], 10);
  if (isNaN(hour) || isNaN(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  const h = hour.toString().padStart(2, '0');
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m}`;
};

type UseMedicationModalReturn = {
  visible: boolean;
  openModal: (initialSlot?: MedTimeSlot, initialMedId?: string | null) => void;
  closeModal: () => void;

  selectedMedType: MedTimeSlot;
  setSelectedMedType: (type: MedTimeSlot) => void;

  selectedMedId: string | null;
  setSelectedMedId: (id: string | null) => void;

  timeMode: TimeMode;
  setTimeMode: (mode: TimeMode) => void;

  manualTime: string;
  setManualTime: (value: string) => void;

  customMedName: string;
  setCustomMedName: (value: string) => void;

  dosageText: string;
  setDosageText: (value: string) => void;

  memoText: string;
  setMemoText: (value: string) => void;

  linkToReminder: boolean;
  setLinkToReminder: (value: boolean) => void;

  // 「追加する」ボタンを押されたときに TimelineEvent を作って返す
  confirmAndCreateEvent: (onAdd: (event: TimelineEvent) => void) => void;
};

export const useMedicationModal = (
  medList: UserMedication[]
): UseMedicationModalReturn => {
  const [visible, setVisible] = useState(false);

  const [selectedMedType, setSelectedMedType] =
    useState<MedTimeSlot>('morning');

  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);

  const [timeMode, setTimeMode] = useState<TimeMode>('now');
  const [manualTime, setManualTime] = useState('');
  const [customMedName, setCustomMedName] = useState('');
  const [dosageText, setDosageText] = useState('');
  const [memoText, setMemoText] = useState('');
  const [linkToReminder, setLinkToReminder] = useState(false);

  const openModal = (
    initialSlot: MedTimeSlot = 'morning',
    initialMedId: string | null = null
  ) => {
    setSelectedMedType(initialSlot);

    // 💊 薬の初期選択ロジック
    if (initialMedId) {
      setSelectedMedId(initialMedId);
    } else if (medList.length > 0) {
      // 一覧があるなら先頭を自動選択
      setSelectedMedId(medList[0].id);
    } else {
      // 薬が1つも登録されてない場合は custom 状態っぽく扱う
      setSelectedMedId(null);
    }

    setTimeMode('now');
    setManualTime('');
    setCustomMedName('');
    setDosageText('');
    setMemoText('');
    setLinkToReminder(false);
    setVisible(true);
  };

  const closeModal = () => setVisible(false);

  /**
   * ラベル生成ロジック
   * - 優先度:
   *   1) selectedMedId に紐づく medList の name
   *   2) customMedName
   *   3) タイムスロットごとのデフォルト表示（朝の薬 / 夜の薬 / 頓服…）
   */
  const buildMedicationLabel = (): {
    label: string;
    dosage?: string;
    medId?: string;
  } => {
    const selectedMed = selectedMedId
      ? medList.find(m => m.id === selectedMedId)
      : undefined;

    let base: string;

    if (selectedMed) {
      base = selectedMed.name;
    } else if (customMedName.trim()) {
      base = customMedName.trim();
    } else {
      switch (selectedMedType) {
        case 'morning':
          base = '朝の薬';
          break;
        case 'night':
          base = '夜の薬';
          break;
        case 'prn_anxiety':
          base = '頓服（抗不安薬）';
          break;
        case 'prn_sleep':
          base = '頓服（睡眠薬）';
          break;
        default:
          base = 'お薬';
      }
    }

    const defaultDosage = selectedMed?.defaultDosage ?? '';
    const dosage =
      (dosageText.trim() || defaultDosage || '').trim() || undefined;

    const label = dosage ? `${base} ${dosage}` : base;

    return {
      label,
      dosage,
      medId: selectedMed?.id,
    };
  };

  const confirmAndCreateEvent = (onAdd: (event: TimelineEvent) => void) => {
    const time =
      timeMode === 'now'
        ? getCurrentTimeString()
        : normalizeTimeString(manualTime) ?? getCurrentTimeString();

    const { label, dosage, medId } = buildMedicationLabel();

    const newEvent: TimelineEvent = {
      id: `${Date.now()}`,
      time,
      type: 'med',
      label,
      planned: false,
      emoji: '💊',
      memo: memoText.trim() || undefined,
      medId: medId ?? undefined,
      medTimeSlot: selectedMedType,
      dosageText: dosage,
    };

    onAdd(newEvent);
    setVisible(false);
  };

  return {
    visible,
    openModal,
    closeModal,
    selectedMedType,
    setSelectedMedType,
    selectedMedId,
    setSelectedMedId,
    timeMode,
    setTimeMode,
    manualTime,
    setManualTime,
    customMedName,
    setCustomMedName,
    dosageText,
    setDosageText,
    memoText,
    setMemoText,
    linkToReminder,
    setLinkToReminder,
    confirmAndCreateEvent,
  };
};