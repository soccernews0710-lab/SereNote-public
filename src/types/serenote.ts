// src/types/serenote.ts
import type { TimelineEvent } from './timeline';

// "YYYY-MM-DD" 形式（例: 2025-12-01）
export type DateKey = string;

// "HH:MM" 形式（例: 09:30）
export type TimeText = string;

/**
 * 気分スコア（-2〜+2 の 5段階）
 *
 * -2: とてもつらい
 * -1: つらい
 *  0: ふつう
 *  1: 少し良い
 *  2: とても良い
 *
 * 👉 内部ではこの -2〜+2 を「生の値」として持っておく。
 *    グラフや集計は utils/mood.ts 側で 1〜5 に変換して使う。
 */
export type SerenoteMoodValue = -2 | -1 | 0 | 1 | 2;

export type SerenoteMood = {
  value: SerenoteMoodValue;
  time?: TimeText | null; // 記録した時間（任意）
  memo?: string | null;   // 補足メモ（任意）
};

export type SerenoteSleep = {
  bedTime?: TimeText | null;  // 寝た時間（任意）
  wakeTime?: TimeText | null; // 起きた時間（任意）
  totalMinutes?: number;
  memo?: string | null;       // 眠れなかった等のメモ（任意）
};

export type SerenoteMedicationLog = {
  id: string;        // その日の中で一意になるID（編集・削除用）
  time: TimeText;    // 飲んだ時間
  label: string;     // 薬の名前（例: クロザリル 25mg）
  memo?: string | null; // 「不安が強くなったので服用」など（任意）
};

export type SerenoteSymptomLog = {
  id: string;        // その日の中で一意になるID
  time: TimeText;    // 症状が出た時間
  label: string;     // 症状の短い説明（例: 動悸・息苦しさ）
  memo?: string | null; // 詳細メモ（任意）
  forDoctor?: boolean;
};

export type SerenoteNote = {
  id: string;      // その日の中で一意になるID
  time: TimeText;  // メモを書いた時間
  text: string;    // 本文
};

/**
 * 1日分のすべての記録
 */
export type SerenoteEntry = {
  date: DateKey;

  mood?: SerenoteMood | null;
  sleep?: SerenoteSleep | null;

  medications?: SerenoteMedicationLog[];
  symptoms?: SerenoteSymptomLog[];
  notes?: SerenoteNote[];

  // ⭐ Today 用タイムラインをそのまま保存しておくフィールド
  timelineEvents?: TimelineEvent[];

  createdAt?: string;
  updatedAt?: string;
};

/**
 * AsyncStorage に保存するときの全体構造：
 * { "2025-12-01": SerenoteEntry, "2025-12-02": SerenoteEntry, ... }
 */
export type SerenoteEntryMap = {
  [date: DateKey]: SerenoteEntry;
};

/**
 * 指定した date 用の「空のエントリ」を作るヘルパー
 * （Today 初期表示などで使いやすいように）
 */
export const createEmptySerenoteEntry = (date: DateKey): SerenoteEntry => ({
  date,
  mood: undefined,
  sleep: undefined,
  medications: [],
  symptoms: [],
  notes: [],
  timelineEvents: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});