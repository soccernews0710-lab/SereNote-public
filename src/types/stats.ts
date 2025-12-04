// src/types/stats.ts
import type { DateKey } from './serenote';

export type MoodStabilityLabel =
  | '安定していた日'
  | '少し波があった日'
  | '波が大きかった日'
  | 'データなし';

export type SleepQualityTag =
  | '少なめ'
  | 'ちょうど良い'
  | '多め'
  | 'データなし';

export interface MoodStats {
  hasData: boolean;
  avgValue: number | null;       // 1〜5 の生平均
  avgRounded: number | null;     // グラフ用に丸めた 1〜5
  firstValue: number | null;     // その日の最初の気分
  lastValue: number | null;      // その日の最後の気分
  minValue: number | null;
  maxValue: number | null;
  volatility: number | null;     // max - min
  samples: number;               // 記録回数
  label: string;                 // 代表ラベル（例: '😐 ふつう'）
  stabilityLabel: MoodStabilityLabel;
}

export interface SleepStats {
  hasData: boolean;
  totalMinutes: number | null;   // 総睡眠時間（分）
  hours: number | null;          // 総睡眠時間（時間）
  label: string;                 // 例: '7.0h' or '—'
  qualityTag: SleepQualityTag;   // 少なめ / ちょうど良い / 多め / データなし
}

export interface MedStats {
  count: number;                 // その日の服薬イベント数
}

export interface NoteStats {
  notesCount: number;
  symptomsCount: number;
  totalEvents: number;           // notes + symptoms
}

export interface DailyStats {
  date: DateKey;

  mood: MoodStats;
  sleep: SleepStats;
  meds: MedStats;
  notes: NoteStats;
}

export type DailyStatsMap = Record<DateKey, DailyStats>;