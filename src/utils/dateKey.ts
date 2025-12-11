// src/utils/dateKey.ts
// --------------------------------------------------
// SereNote 用 DateKey ("YYYY-MM-DD") 専用ユーティリティ
//
// ・全機能が DateKey を正規フォーマットとして扱う
// ・内部処理は「ローカル日付」を基準にする（UTC に潰れない）
// ・Today, History, Stats 全部で共通使用できる
// --------------------------------------------------

import type { DateKey } from '@/src/types/serenote';

/**
 * DateKey が "YYYY-MM-DD" フォーマットとして有効かチェック
 */
export function isValidDateKey(key: string): key is DateKey {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;

  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  // 例えば "2025-02-30" のような存在しない日付を弾く
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

/**
 * DateKey → JS Date（ローカル時間）への変換
 */
export function parseDateKey(key: DateKey): Date {
  if (!isValidDateKey(key)) {
    throw new Error(`Invalid DateKey: ${key}`);
  }
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * JS Date → DateKey ("YYYY-MM-DD") 形式へ変換
 * ※ 時刻成分は無視し、年月日だけを使用
 */
export function formatDateKey(date: Date): DateKey {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 今日の DateKey（ローカルタイム基準）
 */
export function getTodayDateKey(): DateKey {
  return formatDateKey(new Date());
}

/**
 * 指定した DateKey の前日を返す
 */
export function getPrevDateKey(key: DateKey): DateKey {
  const date = parseDateKey(key);
  date.setDate(date.getDate() - 1);
  return formatDateKey(date);
}

/**
 * 指定した DateKey の翌日を返す
 */
export function getNextDateKey(key: DateKey): DateKey {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + 1);
  return formatDateKey(date);
}

/**
 * 指定した2つの DateKey の間の日数（差分）を返す
 * 例: diffDateKeys("2025-01-01", "2025-01-03") → 2
 */
export function diffDateKeys(a: DateKey, b: DateKey): number {
  const da = parseDateKey(a);
  const db = parseDateKey(b);
  const ms = db.getTime() - da.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * DateKey の配列を日付順にソート（古い → 新しい）
 */
export function sortDateKeys(keys: DateKey[]): DateKey[] {
  return [...keys].sort((a, b) =>
    parseDateKey(a).getTime() - parseDateKey(b).getTime()
  );
}

/**
 * 終端日 end を含む、指定日数分の DateKey 配列を返す
 * 例: getDateRange("2025-01-05", 3)
 *     → ["2025-01-03", "2025-01-04", "2025-01-05"]
 */
export function getDateRange(end: DateKey, days: number): DateKey[] {
  const endDate = parseDateKey(end);
  const list: DateKey[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(endDate.getDate() - i);
    list.push(formatDateKey(d));
  }
  return list;
}

/**
 * DateKey を人間向けラベルへフォーマット
 * 例: 2025-03-01 → "3月1日(土)"
 */
export function formatDateKeyLabel(key: DateKey): string {
  const d = parseDateKey(key);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getMonth() + 1}月${d.getDate()}日(${weekdays[d.getDay()]})`;
}