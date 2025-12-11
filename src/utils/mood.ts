// src/utils/mood.ts

import type { SerenoteMoodValue } from '../types/serenote';

/**
 * mood の生値:
 * - 1〜5 の 5段階スコア
 * - -2〜+2 のセンタリングスコア
 * どちらも受け付けるための型
 */
export type MoodRaw = SerenoteMoodValue | number | null | undefined;

/**
 * 1〜5 / -2〜+2 のどちらでも受け取り、
 * 「1〜5 のスコア」に正規化して返す。
 *
 * 不正な値の場合は null。
 */
export function normalizeMoodValue(raw: MoodRaw): number | null {
  if (raw == null) return null;
  const v = Number(raw);
  if (Number.isNaN(v)) return null;

  // ✅ 先に「1〜5」を優先して扱う
  if (v >= 1 && v <= 5) {
    return clamp(v, 1, 5);
  }

  // それ以外で -2〜+2 の場合は「センタリング値」として 1〜5 に変換
  if (v >= -2 && v <= 2) {
    const normalized = v + 3; // -2→1, -1→2, 0→3, 1→4, 2→5
    return clamp(normalized, 1, 5);
  }

  return null;
}

/**
 * 1〜5 の正規化スコアを -2〜+2 に変換。
 * （センタリング表示や内部表現用）
 */
export function normalizedToRawCentered(normalized: number): number {
  const v = clamp(normalized, 1, 5);
  // 1→-2, 2→-1, 3→0, 4→1, 5→2
  return v - 3;
}

/**
 * -2〜+2 の raw（センタリング）を 1〜5 に。
 * normalizeMoodValue の単純ラッパ。
 */
export function rawCenteredToNormalized(raw: number): number | null {
  return normalizeMoodValue(raw);
}

/**
 * 1〜5 → ラベル
 */
export function moodValueToLabel(normalized: number): string {
  const v = clamp(Math.round(normalized), 1, 5);
  const map: Record<number, string> = {
    1: 'とてもつらい',
    2: 'つらい',
    3: 'ふつう',
    4: '少し良い',
    5: 'とても良い',
  };
  return map[v] ?? '—';
}

/**
 * 1〜5 → 絵文字
 */
export function moodValueToEmoji(normalized: number): string {
  const v = clamp(Math.round(normalized), 1, 5);
  const map: Record<number, string> = {
    1: '😭',
    2: '😣',
    3: '😐',
    4: '🙂',
    5: '😄',
  };
  return map[v] ?? '❓';
}

/**
 * Raw 値（1〜5 / -2〜+2）から
 * ラベル＋絵文字を一発で取得するヘルパ。
 */
export function describeMood(raw: MoodRaw): {
  normalized: number | null;
  label: string;
  emoji: string;
} {
  const normalized = normalizeMoodValue(raw);
  if (normalized == null) {
    return {
      normalized: null,
      label: '—',
      emoji: '❓',
    };
  }
  return {
    normalized,
    label: moodValueToLabel(normalized),
    emoji: moodValueToEmoji(normalized),
  };
}

/**
 * タイムライン用など、
 * Raw 値から「😄 とても良い」形式の文字列を生成。
 */
export function moodRawToDisplayText(raw: MoodRaw): string {
  const { label, emoji } = describeMood(raw);
  if (label === '—') return '気分: —';
  return `気分: ${emoji} ${label}`;
}

/**
 * -2〜+2 の raw を 0〜4 のインデックス（UI スライダー用）に変換
 * -2→0, -1→1, 0→2, 1→3, 2→4
 */
export function moodRawToIndex(raw: number): number {
  const clamped = clamp(raw, -2, 2);
  return clamped + 2;
}

/**
 * 0〜4 のインデックス（UI スライダー用）を -2〜+2 の raw に変換
 */
export function moodIndexToRaw(index: number): number {
  const idx = clamp(Math.round(index), 0, 4);
  return idx - 2;
}

/**
 * 平均スコア(1〜5) からざっくりラベルを出す用
 * Stats のサマリーで使う。
 */
export function moodAverageToLabel(avg: number | null): string {
  if (avg == null) return '—';
  if (avg < 1.5) return 'とてもつらい';
  if (avg < 2.5) return 'つらい';
  if (avg < 3.5) return 'ふつう';
  if (avg < 4.5) return '少し良い';
  return 'とても良い';
}

// ===== 内部ユーティリティ =====

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}