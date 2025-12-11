// src/types/timeline.ts
import type { SerenoteMoodValue } from './serenote';

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

// 🌟 行動カテゴリ（プリセット）
export type ActivityCategory =
  | 'meal'
  | 'walk'
  | 'exercise'
  | 'rest'
  | 'nap'
  | 'work'
  | 'talk'
  | 'bath'
  | 'screen'
  | 'out'
  | 'other';

// カテゴリごとのラベル・絵文字定義（UI 共通で使う想定）
export const ACTIVITY_CATEGORY_META: Record<
  ActivityCategory,
  { label: string; emoji: string }
> = {
  meal: { label: 'ごはん', emoji: '🍚' },
  walk: { label: '散歩', emoji: '🚶‍♂️' },
  exercise: { label: '運動', emoji: '🏋️' },
  rest: { label: '休憩', emoji: '🧘‍♀️' },
  nap: { label: '昼寝', emoji: '😴' },
  work: { label: '作業', emoji: '💻' },
  talk: { label: '会話', emoji: '🗣️' },
  bath: { label: 'お風呂', emoji: '🛁' },
  screen: { label: '画面時間', emoji: '📱' },
  out: { label: '外出', emoji: '🌤️' },
  other: { label: 'その他', emoji: '✅' },
};

// 1件分のタイムラインイベント
export type TimelineEvent = {
  id: string;

  // もともとの「1点」の時間
  time: string; // "HH:MM"

  // 🌟 区間行動用（例：19:00〜19:30 の散歩）
  endTime?: string; // "HH:MM"（任意）

  type: TimelineEventType;
  label: string;

  planned: boolean; // 予定かどうか（true = 予定、false = 実績）
  emoji?: string;

  // 🧠 気分イベント用：1〜5 のスコア（旧データでは -2〜+2 が入っている可能性あり）
  moodValue?: SerenoteMoodValue | number;

  // 💊 新しい薬マスタ方式
  medId?: string; // どの薬を飲んだか（UserMedication.id）
  medTimeSlot?: MedTimeSlot; // 朝/夜/頓服 など
  dosageText?: string; // 「1錠 / 5mg」など

  // 🌟 行動カテゴリ（activity のときメインで使用）
  category?: ActivityCategory;

  // 共通メモ
  memo?: string;

  // 🩺 診察で話したいフラグ（主に symptom イベントで使用）
  forDoctor?: boolean;
};

// 設定画面で管理する「薬1種類」の情報
export type UserMedication = {
  id: string; // uuid 的な一意ID
  name: string; // 例：クロザリル 25mg
  defaultDosage?: string; // 例：1錠
  tags?: string[]; // 「抗精神病薬」など（あとで統計・フィルタ用）
};

// 旧: スケジュール単位の定義が必要な場合に使える型（今はあまり使ってないはず）
export type MedDefinition = {
  id: string;
  schedule: MedScheduleKey;
  name: string;
  defaultDosage?: string;
  // ※ forDoctor は症状イベント側で持つ
};

// 🔔 通知用の時刻（朝・夜）
// useMedicationNotifications で使う型
export type ReminderTimes = {
  morning: string | null; // "08:00" など
  night: string | null; // "20:00" など
};