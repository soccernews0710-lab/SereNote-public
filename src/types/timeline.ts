// src/types/timeline.ts

// タイムラインに登場するイベントの種類
export type TimelineEventType =
  | 'wake'
  | 'sleep'
  | 'med'
  | 'mood'
  | 'symptom'
  | 'activity'
  | 'note';

// 固定スケジュールの「枠」（朝・夜・頓服など）
export type MedScheduleKey =
  | 'morning'
  | 'night'
  | 'prn_anxiety'
  | 'prn_sleep'
  | 'custom';

// イベント側で使う「どのタイミングの薬か」
export type MedTimeSlot =
  | 'morning'
  | 'night'
  | 'prn_anxiety'
  | 'prn_sleep'
  | 'custom';

// 1件分のタイムラインイベント
export type TimelineEvent = {
  id: string;
  time: string;            // "HH:MM"
  type: TimelineEventType; // 上の union をそのまま使う
  label: string;

  planned: boolean;        // 予定かどうか（true = 予定、false = 実績）
  emoji?: string;

  // 💊 新しい薬マスタ方式
  medId?: string;             // どの薬を飲んだか（UserMedication.id）
  medTimeSlot?: MedTimeSlot;  // 朝/夜/頓服 など
  dosageText?: string;        // 「1錠 / 5mg」など

  // 共通メモ
  memo?: string;
};

// 設定画面で管理する「薬1種類」の情報
export type UserMedication = {
  id: string;             // uuid 的な一意ID
  name: string;           // 例：クロザリル 25mg
  defaultDosage?: string; // 例：1錠
  tags?: string[];        // 「抗精神病薬」など（あとで統計・フィルタ用）
};

// 旧: スケジュール単位の定義が必要な場合に使える型（今はあまり使ってないはず）
export type MedDefinition = {
  id: string;
  schedule: MedScheduleKey;
  name: string;
  defaultDosage?: string;
};

// 🔔 通知用の時刻（朝・夜）
// useMedicationNotifications で使う型
export type ReminderTimes = {
  morning: string | null; // "08:00" など
  night: string | null;   // "20:00" など
};