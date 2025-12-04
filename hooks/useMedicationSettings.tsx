// hooks/useMedicationSettings.tsx
// アプリ全体で共有する「お薬設定」用コンテキスト + フック

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { UserMedication } from '../src/types/timeline';
import { useMedicationNotifications } from './useMedicationNotifications';

const KEY_MED_LIST = 'user_med_list_v1';
const KEY_REMINDER = 'user_med_reminder_v1';

export type MedReminderTimes = {
  morning: string | null;
  night: string | null;
};

type MedicationSettingsContextValue = {
  loaded: boolean;
  medList: UserMedication[];
  reminderTimes: MedReminderTimes;

  addMedication: (name: string, defaultDosage?: string) => Promise<void>;
  updateMedication: (
    id: string,
    partial: Partial<UserMedication>
  ) => Promise<void>;
  removeMedication: (id: string) => Promise<void>;
  setReminderTime: (
    slot: 'morning' | 'night',
    value: string | null
  ) => Promise<void>;
};

// uuid の代わりに安全な簡易ID
const generateId = () =>
  `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const MedicationSettingsContext =
  createContext<MedicationSettingsContextValue | undefined>(undefined);

type ProviderProps = {
  children: ReactNode;
};

export const MedicationSettingsProvider: React.FC<ProviderProps> = ({
  children,
}) => {
  const [medList, setMedList] = useState<UserMedication[]>([]);
  const [reminderTimes, setReminderTimes] = useState<MedReminderTimes>({
    morning: null,
    night: null,
  });
  const [loaded, setLoaded] = useState(false);

  // ⭐ 初期ロード（1回）
  useEffect(() => {
    (async () => {
      try {
        const storedMedList = await AsyncStorage.getItem(KEY_MED_LIST);
        if (storedMedList) {
          setMedList(JSON.parse(storedMedList));
        }

        const storedReminder = await AsyncStorage.getItem(KEY_REMINDER);
        if (storedReminder) {
          setReminderTimes(JSON.parse(storedReminder));
        }
      } catch (err) {
        console.warn('Error loading medication settings:', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // ⭐ 保存ヘルパー
  const saveMedList = async (updated: UserMedication[]) => {
    setMedList(updated);
    await AsyncStorage.setItem(KEY_MED_LIST, JSON.stringify(updated));
  };

  const saveReminderTimes = async (updated: MedReminderTimes) => {
    setReminderTimes(updated);
    await AsyncStorage.setItem(KEY_REMINDER, JSON.stringify(updated));
  };

  // ⭐ 公開メソッド：薬追加
  const addMedication = async (name: string, defaultDosage?: string) => {
    const newMed: UserMedication = {
      id: generateId(),
      name,
      defaultDosage,
      tags: [],
    };
    await saveMedList([...medList, newMed]);
  };

  // ⭐ 公開メソッド：薬更新
  const updateMedication = async (
    id: string,
    partial: Partial<UserMedication>
  ) => {
    const updated = medList.map(m =>
      m.id === id ? { ...m, ...partial } : m
    );
    await saveMedList(updated);
  };

  // ⭐ 公開メソッド：薬削除
  const removeMedication = async (id: string) => {
    const updated = medList.filter(m => m.id !== id);
    await saveMedList(updated);
  };

  // ⭐ 朝・夜リマインダーの設定
  const setReminderTime = async (
    slot: 'morning' | 'night',
    value: string | null
  ) => {
    const updated: MedReminderTimes = {
      ...reminderTimes,
      [slot]: value,
    };
    await saveReminderTimes(updated);
  };

  // ⭐ 通知スケジューラー（朝/夜の変更に反応）
  useMedicationNotifications(reminderTimes);

  const value: MedicationSettingsContextValue = {
    loaded,
    medList,
    reminderTimes,
    addMedication,
    updateMedication,
    removeMedication,
    setReminderTime,
  };

  return (
    <MedicationSettingsContext.Provider value={value}>
      {children}
    </MedicationSettingsContext.Provider>
  );
};

// ⭐ どの画面からでも使えるフック
export function useMedicationSettings(): MedicationSettingsContextValue {
  const ctx = useContext(MedicationSettingsContext);
  if (!ctx) {
    throw new Error(
      'useMedicationSettings must be used within MedicationSettingsProvider'
    );
  }
  return ctx;
}