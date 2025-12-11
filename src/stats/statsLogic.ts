// src/stats/statsLogic.ts
import { getTodayKey } from '../../hooks/useDayEvents';
import type {
  DateKey,
  SerenoteEntry,
  SerenoteEntryMap,
} from '../types/serenote';

// 🆕 日付ユーティリティ
import {
  formatDateKeyLabel,
  getDateRange,
  getPrevDateKey,
} from '../utils/dateKey';

// 🆕 気分ユーティリティ
import {
  moodAverageToLabel,
  normalizeMoodValue,
} from '../utils/mood';

// ========= 型 =========

export type StatsPeriod = '7d' | '30d' | '90d';

export type SleepQualityTag =
  | 'データなし'
  | '少なめ'
  | 'ちょうど良い'
  | '多め';

export type StatsRow = {
  dateKey: DateKey;
  dateLabel: string;
  moodAvg: number | null;
  moodMin: number | null;
  moodMax: number | null;
  sleepMinutes: number | null;
  medsCount: number;
  notesCount: number;
  symptomsCount: number;
  // 🆕 行動の合計時間（分）
  activityMinutes: number;
};

export type ChartPoint = {
  index: number;
  label: string;
  value: number;
};

export type DoctorSymptomItem = {
  id: string;
  date: DateKey;
  time?: string;
  label: string;
  memo?: string;
  forDoctor?: boolean;
};

// 🆕 行動 × 気分 用のサマリー
export type ActivityMoodEffect = {
  hasActivityDays: number;
  noActivityDays: number;
  avgMoodWithActivity: number | null;
  avgMoodWithoutActivity: number | null;
  diff: number | null; // with - without
};

// ========= 日付ユーティリティ =========

export function formatDateLabel(dateKey: DateKey): string {
  // グラフなどで使う日付ラベル（例: "3月1日(土)"）
  return formatDateKeyLabel(dateKey);
}

// ========= 共通：HH:MM → 分 =========

function parseHHMMToMinutes(text: string | undefined | null): number | null {
  if (!text) return null;
  const m = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  return h * 60 + min;
}

// ========= 睡眠関連 =========

export function calcDailySleepMinutes(
  date: DateKey,
  allEntries: SerenoteEntryMap
): number | null {
  const entry = allEntries[date];
  if (!entry) return null;

  // あれば totalMinutes を使う
  const explicitTotal = (entry as any).sleep?.totalMinutes;
  if (typeof explicitTotal === 'number') return explicitTotal;

  const todayWake = parseHHMMToMinutes(
    (entry as any).sleep?.wakeTime ?? null
  );

  const prev = allEntries[getPrevDateKey(date)];
  const bedStr =
    (prev as any)?.sleep?.bedTime ??
    (entry as any).sleep?.bedTime ??
    null;

  const bed = parseHHMMToMinutes(bedStr);

  if (bed == null || todayWake == null) return null;

  let diff = todayWake - bed;
  if (diff <= 0) diff += 24 * 60;

  return diff;
}

export function sleepMinutesToQualityTag(
  totalMinutes: number | null
): SleepQualityTag {
  if (totalMinutes == null) return 'データなし';
  if (totalMinutes < 360) return '少なめ';
  if (totalMinutes <= 540) return 'ちょうど良い';
  return '多め';
}

// ========= 気分 / メモ / 薬 集計 =========

export function calcDailyMoodAverage(
  entry: SerenoteEntry | undefined
): {
  avg: number | null;
  min: number | null;
  max: number | null;
} {
  if (!entry || !(entry as any).mood) {
    return { avg: null, min: null, max: null };
  }

  // entry.mood.value は 1〜5 or -2〜+2 を想定
  const normalized = normalizeMoodValue((entry as any).mood.value);
  if (normalized == null) {
    return { avg: null, min: null, max: null };
  }

  // 現状、1日1つの mood なので avg/min/max 同じでOK
  return {
    avg: normalized,
    min: normalized,
    max: normalized,
  };
}

export function calcDailyMedsCount(
  entry: SerenoteEntry | undefined
): number {
  if (!entry || !(entry as any).medications) return 0;
  return ((entry as any).medications as any[]).length;
}

export function calcDailyNotesAndSymptomsCount(
  entry: SerenoteEntry | undefined
): { notes: number; symptoms: number } {
  if (!entry) return { notes: 0, symptoms: 0 };
  const notes = ((entry as any).notes as any[] | undefined)?.length ?? 0;
  const symptoms =
    ((entry as any).symptoms as any[] | undefined)?.length ?? 0;
  return { notes, symptoms };
}

// 🆕 ========= 行動時間（分） =========
// TimelineEvent の startTime / endTime / time を使って、
// 1日の「行動イベント」の合計分数を出す。
export function calcDailyActivityMinutes(
  entry: SerenoteEntry | undefined
): number {
  if (!entry) return 0;

  const events: any[] | undefined = (entry as any).timelineEvents;
  if (!events || events.length === 0) return 0;

  let total = 0;

  events.forEach(ev => {
    if (ev.type !== 'activity') return;

    const startStr: string | undefined =
      ev.startTime ?? ev.time ?? undefined;
    const endStr: string | undefined = ev.endTime ?? undefined;

    const start = parseHHMMToMinutes(startStr);
    const end = parseHHMMToMinutes(endStr);

    // end がない or パースできない場合は「まだ終了してない」とみなして無視
    if (start == null || end == null) return;

    let diff = end - start;
    // 日付またぎはあまり想定しないので、0以下は無視してOK
    if (diff <= 0) return;

    total += diff;
  });

  return total;
}

// ========= StatsRow ビルド =========

export function buildStatsRowsForPeriod(
  allEntries: SerenoteEntryMap,
  period: StatsPeriod
): StatsRow[] {
  const todayKey = getTodayKey();
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const dateKeys = getDateRange(todayKey, days);

  const rows: StatsRow[] = dateKeys.map(dateKey => {
    const entry = allEntries[dateKey];
    const mood = calcDailyMoodAverage(entry);
    const sleepMinutes = calcDailySleepMinutes(dateKey, allEntries);
    const medsCount = calcDailyMedsCount(entry);
    const { notes, symptoms } = calcDailyNotesAndSymptomsCount(entry);
    const activityMinutes = calcDailyActivityMinutes(entry);

    return {
      dateKey,
      dateLabel: formatDateLabel(dateKey),
      moodAvg: mood.avg,
      moodMin: mood.min,
      moodMax: mood.max,
      sleepMinutes,
      medsCount,
      notesCount: notes,
      symptomsCount: symptoms,
      activityMinutes,
    };
  });

  return rows;
}

// ========= サマリー計算 =========

export function calcMoodSummary(rows: StatsRow[]) {
  const values = rows
    .map(r => r.moodAvg)
    .filter((v): v is number => v != null);

  if (values.length === 0) {
    return {
      avgScore: null as number | null,
      avgLabel: '—',
      stabilityLabel: 'データなし',
    };
  }

  const sum = values.reduce((acc, v) => acc + v, 0);
  const avg = sum / values.length;

  const avgLabel = moodAverageToLabel(avg);

  const max = Math.max(...values);
  const min = Math.min(...values);
  const diff = max - min;

  let stabilityLabel = '気分はかなり安定';
  if (diff >= 1.5) stabilityLabel = '気分の波が大きめ';
  else if (diff >= 0.8) stabilityLabel = 'やや変動あり';

  return { avgScore: avg, avgLabel, stabilityLabel };
}

export function calcSleepSummary(rows: StatsRow[]) {
  const values = rows
    .map(r => r.sleepMinutes)
    .filter((v): v is number => v != null);

  if (values.length === 0) {
    return {
      avgHours: null as number | null,
      daysWithData: 0,
      volumeTag: 'データなし' as SleepQualityTag,
    };
  }

  const sum = values.reduce((acc, v) => acc + v, 0);
  const avgMinutes = sum / values.length;
  const avgHours = avgMinutes / 60;

  const volumeTag = sleepMinutesToQualityTag(avgMinutes);

  return {
    avgHours,
    daysWithData: values.length,
    volumeTag,
  };
}

export function calcMedsSummary(rows: StatsRow[]) {
  const counts = rows.map(r => r.medsCount);
  const sum = counts.reduce((acc, v) => acc + v, 0);
  const avgPerDay = counts.length > 0 ? sum / counts.length : 0;
  const daysWithMeds = counts.filter(c => c > 0).length;

  return { avgPerDay, daysWithMeds };
}

export function calcNotesSummary(rows: StatsRow[]) {
  const totals = rows.map(r => r.notesCount + r.symptomsCount);
  const sum = totals.reduce((acc, v) => acc + v, 0);
  const avgPerDay = totals.length > 0 ? sum / totals.length : 0;
  const daysWithAny = totals.filter(c => c > 0).length;

  return { avgPerDay, daysWithAny };
}

// ⭐ 期間サマリー（A5 用）
export function calcOverviewSummary(rows: StatsRow[]) {
  const totalDays = rows.length;

  const daysWithAnyRecord = rows.filter(r => {
    const hasMood = r.moodAvg != null;
    const hasSleep = r.sleepMinutes != null;
    const hasMeds = r.medsCount > 0;
    const hasNotes = r.notesCount > 0;
    const hasSymptoms = r.symptomsCount > 0;
    const hasActivity = r.activityMinutes > 0;
    return (
      hasMood ||
      hasSleep ||
      hasMeds ||
      hasNotes ||
      hasSymptoms ||
      hasActivity
    );
  }).length;

  const recordRate =
    totalDays > 0 ? daysWithAnyRecord / totalDays : 0;

  // 平均気分
  const moodValues = rows
    .map(r => r.moodAvg)
    .filter((v): v is number => v != null);

  let avgMoodScore: number | null = null;
  let avgMoodLabel = '—';
  if (moodValues.length > 0) {
    const sum = moodValues.reduce((acc, v) => acc + v, 0);
    avgMoodScore = sum / moodValues.length;
    avgMoodLabel = moodAverageToLabel(avgMoodScore);
  }

  // 平均睡眠時間（h）
  const sleepValues = rows
    .map(r => r.sleepMinutes)
    .filter((v): v is number => v != null);

  let avgSleepHours: number | null = null;
  if (sleepValues.length > 0) {
    const sum = sleepValues.reduce((acc, v) => acc + v, 0);
    avgSleepHours = sum / sleepValues.length / 60;
  }

  return {
    totalDays,
    daysWithAnyRecord,
    recordRate,
    avgMoodScore,
    avgMoodLabel,
    avgSleepHours,
  };
}

// ========= グラフ用ポイント =========

export function buildChartPoints(
  rows: StatsRow[],
  selector: (row: StatsRow) => number | null
): ChartPoint[] {
  const pts: ChartPoint[] = [];
  rows.forEach(row => {
    const v = selector(row);
    if (v == null) return;
    pts.push({
      index: pts.length,
      label: row.dateLabel,
      value: v,
    });
  });
  return pts;
}

// ========= 「診察で話したい」症状抽出 =========

export function collectDoctorSymptoms(
  all: SerenoteEntryMap
): DoctorSymptomItem[] {
  const items: DoctorSymptomItem[] = [];

  Object.entries(all).forEach(([date, entry]) => {
    const symptoms: any[] | undefined = (entry as any).symptoms;
    if (!symptoms || symptoms.length === 0) return;

    symptoms.forEach(sym => {
      if (sym.forDoctor) {
        items.push({
          id: sym.id ?? `${date}_${sym.time ?? ''}_${sym.label}`,
          date: date as DateKey,
          time: sym.time,
          label: sym.label,
          memo: sym.memo,
          forDoctor: sym.forDoctor,
        });
      }
    });
  });

  // 新しい日付・時間順にソート
  return items.sort((a, b) => {
    if (a.date === b.date) {
      return (b.time ?? '').localeCompare(a.time ?? '');
    }
    return b.date.localeCompare(a.date);
  });
}

// ========= 行動 × 気分 サマリー =========

export function calcActivityMoodEffect(
  rows: StatsRow[]
): ActivityMoodEffect {
  const withActivity: number[] = [];
  const withoutActivity: number[] = [];

  rows.forEach(r => {
    if (r.moodAvg == null) return; // 気分が入ってない日は除外

    if (r.activityMinutes > 0) {
      withActivity.push(r.moodAvg);
    } else {
      withoutActivity.push(r.moodAvg);
    }
  });

  const avg = (vals: number[]): number | null =>
    vals.length > 0
      ? vals.reduce((acc, v) => acc + v, 0) / vals.length
      : null;

  const avgWith = avg(withActivity);
  const avgWithout = avg(withoutActivity);

  let diff: number | null = null;
  if (avgWith != null && avgWithout != null) {
    diff = avgWith - avgWithout;
  }

  return {
    hasActivityDays: withActivity.length,
    noActivityDays: withoutActivity.length,
    avgMoodWithActivity: avgWith,
    avgMoodWithoutActivity: avgWithout,
    diff,
  };
}