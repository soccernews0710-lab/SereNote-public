// src/stats/chartData.ts
// Stats 画面用の「1日ぶん集計」と「グラフ用データ変換」をまとめたユーティリティ

import type {
    DateKey,
    SerenoteEntry,
    SerenoteEntryMap,
} from '../types/serenote';

// ==============================
// 型定義
// ==============================

/**
 * Stats で使う「1日ぶんの集計行」
 * → この形にしておくと、カードのテキスト表示にもグラフにも使い回せる
 */
export type StatsDayRow = {
  date: DateKey;
  /** その日の気分スコア（1〜5）。複数回あるなら平均値。なければ null */
  moodAvg1to5: number | null;

  /** その日の「睡眠トータル分（分）」。前日→当日をまたいだ睡眠を含めた値 */
  sleepMinutes: number | null;

  /** その日の服薬イベント総数 */
  medsCount: number;

  /** その日のメモ＋症状の合計件数 */
  notesAndSymptomsCount: number;
};

/**
 * グラフコンポーネントに渡しやすい汎用ポイント型
 * xLabel は "11/30" みたいな表示用
 */
export type ChartPoint = {
  date: DateKey;
  xLabel: string;
  value: number;
};

// ==============================
// 日付ユーティリティ
// ==============================

/** "YYYY-MM-DD" から JS Date を作る簡易ヘルパー */
function parseDateKey(key: DateKey): Date {
  return new Date(`${key}T00:00:00`);
}

/** "YYYY-MM-DD" のフォーマットで date を返す */
function formatDateKey(d: Date): DateKey {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 前日の日付キーを求める */
function getPrevDateKey(date: DateKey): DateKey {
  const d = parseDateKey(date);
  d.setDate(d.getDate() - 1);
  return formatDateKey(d);
}

/** グラフの x 軸用のラベル（例: "11/30"） */
function formatChartLabel(date: DateKey): string {
  const d = parseDateKey(date);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}/${day}`;
}

// ==============================
// 1日ぶん集計ヘルパー
// ==============================

/**
 * その日の気分スコア（1〜5）の平均値を計算する。
 *
 * いまは「entry.mood?.value」1個だけを使っているけど、
 * 将来的に「1日複数回の mood イベント配列」ができたら、
 * ここで配列を平均する形に拡張できる。
 */
function calcDailyMoodAverage(entry: SerenoteEntry | undefined): number | null {
  if (!entry || !entry.mood || entry.mood.value == null) return null;

  // -2〜+2 を 1〜5 にマッピングしている場合：
  //   (value: -2,-1,0,1,2) → (1〜5)
  const raw = entry.mood.value; // -2〜+2 を想定
  const mapped = raw + 3; // -2→1, -1→2, 0→3, 1→4, 2→5

  return mapped;
}

/**
 * 「前日の就寝 → 当日の起床」を含めて、その日ぶんの総睡眠時間（分）をざっくり返す。
 *
 * ※ いまはシンプルに entry.sleep.totalMinutes を優先。
 *    もし totalMinutes がない場合は、ここで bedTime / wakeTime から計算してもOK。
 */
function calcDailySleepMinutes(
  date: DateKey,
  allEntries: SerenoteEntryMap
): number | null {
  const entry = allEntries[date];
  if (!entry) return null;

  // いまは SerenoteSleep 型に totalMinutes が定義されていないので、
  // any キャストで安全に触る（将来 totalMinutes を追加したらそのまま使えるように）
  const sleepAny = entry.sleep as any | undefined;

  if (sleepAny && typeof sleepAny.totalMinutes === 'number') {
    return sleepAny.totalMinutes as number;
  }

  // totalMinutes がまだ無ければ、ひとまず null を返す
  // （あとで bedTime / wakeTime から計算ロジックを足してもOK）
  return null;
}

/**
 * その日の服薬イベント数
 */
function calcDailyMedsCount(entry: SerenoteEntry | undefined): number {
  if (!entry || !entry.medications) return 0;
  return entry.medications.length;
}

/**
 * その日の「メモ＋症状」の総数
 */
function calcDailyNotesAndSymptomsCount(
  entry: SerenoteEntry | undefined
): number {
  if (!entry) return 0;
  const notes = entry.notes?.length ?? 0;
  const symptoms = entry.symptoms?.length ?? 0;
  return notes + symptoms;
}

// ==============================
// StatsDayRow の生成
// ==============================

/**
 * 指定された日付リストについて、StatsDayRow を作成する。
 *
 * @param allEntries  全ての SerenoteEntryMap（AsyncStorage から読み込んだやつ）
 * @param dateKeys    グラフ対象の期間（例: 直近7日ぶんの DateKey 配列）
 */
export function buildStatsDayRows(
  allEntries: SerenoteEntryMap,
  dateKeys: DateKey[]
): StatsDayRow[] {
  return dateKeys.map(dateKey => {
    const entry = allEntries[dateKey];

    const moodAvg1to5 = calcDailyMoodAverage(entry);
    const sleepMinutes = calcDailySleepMinutes(dateKey, allEntries);
    const medsCount = calcDailyMedsCount(entry);
    const notesAndSymptomsCount =
      calcDailyNotesAndSymptomsCount(entry);

    return {
      date: dateKey,
      moodAvg1to5,
      sleepMinutes,
      medsCount,
      notesAndSymptomsCount,
    };
  });
}

// ==============================
// グラフ用データ変換
// ==============================

/**
 * 気分グラフ用データ（1〜5スコア）
 * → null は除外して、データある日だけプロットする
 */
export function toMoodChartPoints(
  rows: StatsDayRow[]
): ChartPoint[] {
  return rows
    .filter(r => r.moodAvg1to5 != null)
    .map(r => ({
      date: r.date,
      xLabel: formatChartLabel(r.date),
      value: r.moodAvg1to5 as number, // filter 済みなので as OK
    }));
}

/**
 * 睡眠グラフ用データ（時間ベース）
 * → 分を「時間（小数）」にして value に入れる
 */
export function toSleepChartPoints(
  rows: StatsDayRow[]
): ChartPoint[] {
  return rows
    .filter(r => r.sleepMinutes != null)
    .map(r => ({
      date: r.date,
      xLabel: formatChartLabel(r.date),
      value: (r.sleepMinutes as number) / 60, // h に変換
    }));
}

/**
 * 服薬グラフ用データ（回数）
 */
export function toMedChartPoints(
  rows: StatsDayRow[]
): ChartPoint[] {
  return rows.map(r => ({
    date: r.date,
    xLabel: formatChartLabel(r.date),
    value: r.medsCount,
  }));
}

/**
 * メモ＋症状グラフ用データ（件数）
 */
export function toNoteSymptomChartPoints(
  rows: StatsDayRow[]
): ChartPoint[] {
  return rows.map(r => ({
    date: r.date,
    xLabel: formatChartLabel(r.date),
    value: r.notesAndSymptomsCount,
  }));
}