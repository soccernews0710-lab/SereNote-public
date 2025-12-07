// app/stats/statsLogic.ts
import { getTodayKey } from '../../hooks/useDayEvents';
import type {
    DateKey,
    SerenoteEntry,
    SerenoteEntryMap,
    SerenoteMoodValue,
} from '../../src/types/serenote';

// ========= 型 =========

export type StatsPeriod = '7d' | '30d' | '90d';

export type SleepQualityTag = 'データなし' | '少なめ' | 'ちょうど良い' | '多め';

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

// ========= 日付ユーティリティ =========

export function formatDateLabel(dateKey: DateKey): string {
  return dateKey;
}

function parseDate(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date: Date, diff: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + diff);
  return d;
}

function formatDateKey(date: Date): DateKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getPrevDateKey(date: DateKey): DateKey {
  return formatDateKey(addDays(parseDate(date), -1));
}

function getDateRange(endDateKey: DateKey, days: number): DateKey[] {
  const end = parseDate(endDateKey);
  const list: DateKey[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(end, -i);
    list.push(formatDateKey(d));
  }
  return list;
}

// ========= 睡眠関連 =========

function parseHHMMToMinutes(text: string | undefined | null): number | null {
  if (!text) return null;
  const m = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  return h * 60 + min;
}

export function calcDailySleepMinutes(
  date: DateKey,
  allEntries: SerenoteEntryMap
): number | null {
  const entry = allEntries[date];
  if (!entry) return null;

  const explicitTotal = (entry as any).sleep?.totalMinutes;
  if (typeof explicitTotal === 'number') return explicitTotal;

  const todayWake = parseHHMMToMinutes((entry as any).sleep?.wakeTime ?? null);

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

export function sleepMinutesToQualityTag(totalMinutes: number | null): SleepQualityTag {
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
  if (!entry || !(entry as any).mood || (entry as any).mood.value == null) {
    return { avg: null, min: null, max: null };
  }

  const raw = (entry as any).mood.value as SerenoteMoodValue;
  const clamped = Math.min(5, Math.max(1, raw));

  return {
    avg: clamped,
    min: clamped,
    max: clamped,
  };
}

export function calcDailyMedsCount(entry: SerenoteEntry | undefined): number {
  if (!entry || !(entry as any).medications) return 0;
  return ((entry as any).medications as any[]).length;
}

export function calcDailyNotesAndSymptomsCount(
  entry: SerenoteEntry | undefined
): { notes: number; symptoms: number } {
  if (!entry) return { notes: 0, symptoms: 0 };
  const notes = ((entry as any).notes as any[] | undefined)?.length ?? 0;
  const symptoms = ((entry as any).symptoms as any[] | undefined)?.length ?? 0;
  return { notes, symptoms };
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

  let avgLabel = '—';
  if (avg < 1.5) avgLabel = 'とてもつらい';
  else if (avg < 2.5) avgLabel = 'つらい';
  else if (avg < 3.5) avgLabel = 'ふつう';
  else if (avg < 4.5) avgLabel = '少し良い';
  else avgLabel = 'とても良い';

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

export function collectDoctorSymptoms(all: SerenoteEntryMap): DoctorSymptomItem[] {
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

  return items.sort((a, b) => {
    if (a.date === b.date) {
      return (b.time ?? '').localeCompare(a.time ?? '');
    }
    return b.date.localeCompare(a.date);
  });
}