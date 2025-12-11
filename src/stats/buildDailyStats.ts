// src/stats/buildDailyStats.ts
import type {
  DateKey,
  SerenoteEntry,
  SerenoteEntryMap,
} from '../types/serenote';
import type {
  DailyStats,
  DailyStatsMap,
  MedStats,
  MoodStabilityLabel,
  MoodStats,
  NoteStats,
  SleepQualityTag,
  SleepStats,
} from '../types/stats';
import type { TimelineEvent } from '../types/timeline';

// 🆕 日付ユーティリティ（前日キー取得）
import { getPrevDateKey } from '../utils/dateKey';

// "HH:mm" → 分（0〜1439）
// フォーマット不正なら null
function parseTimeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const m = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (
    Number.isNaN(h) ||
    Number.isNaN(min) ||
    h < 0 ||
    h > 23 ||
    min < 0 ||
    min > 59
  ) {
    return null;
  }
  return h * 60 + min;
}

// タイムラインの mood イベントから 1〜5 スケールの値を抽出
function convertTimelineMoodToScore(event: TimelineEvent): number | null {
  // もし event に moodValue（-2〜+2）があればそれを優先
  const anyEvent = event as any;
  if (typeof anyEvent.moodValue === 'number') {
    const mv = anyEvent.moodValue; // -2〜+2 の想定
    const normalized = mv + 3; // -2→1, -1→2, 0→3, 1→4, 2→5
    if (normalized >= 1 && normalized <= 5) {
      return normalized;
    }
  }

  // なければ label から推定
  switch (event.label) {
    case 'とてもつらい':
      return 1;
    case 'つらい':
      return 2;
    case 'ふつう':
      return 3;
    case '少し良い':
      return 4;
    case 'とても良い':
      return 5;
    default:
      return null;
  }
}

// SerenoteEntry.mood.value (1〜5) を安全に取得
function getEntryMoodValue(entry: SerenoteEntry): number | null {
  const v = entry.mood?.value;
  if (!v) return null;
  if (v >= 1 && v <= 5) return v;
  return null;
}

// 平均値 → 代表値（1〜5）に丸める
function roundMoodAverage(avgRaw: number): number {
  // しきい値は少しトリッキーにしている
  if (avgRaw < 1.75) return 1;
  if (avgRaw < 2.5) return 2;
  if (avgRaw < 3.5) return 3;
  if (avgRaw < 4.25) return 4;
  return 5;
}

// 1〜5 → ラベル
function moodValueToLabel(v: number): string {
  const map: Record<number, string> = {
    1: '😭 とてもつらい',
    2: '😣 つらい',
    3: '😐 ふつう',
    4: '🙂 少し良い',
    5: '😄 とても良い',
  };
  return map[v] ?? '—';
}

// volatility → 安定度ラベル
function volatilityToStabilityLabel(
  volatility: number | null
): MoodStabilityLabel {
  if (volatility == null) return 'データなし';
  if (volatility <= 1) return '安定していた日';
  if (volatility <= 3) return '少し波があった日';
  return '波が大きかった日';
}

// =======================
//  MoodStats の生成
// =======================

type MoodEventsByDate = TimelineEvent[] | undefined;

function buildMoodStats(
  entry: SerenoteEntry,
  moodEventsForDate: MoodEventsByDate
): MoodStats {
  // 1) mood イベントから値を取る
  const moodEvents = (moodEventsForDate ?? []).filter(
    e => e.type === 'mood'
  );

  const moodValuesFromEvents: number[] = [];
  for (const ev of moodEvents) {
    const v = convertTimelineMoodToScore(ev);
    if (v != null) moodValuesFromEvents.push(v);
  }

  // 2) イベントがなければ Entry.mood.value を fallback として使う
  if (moodValuesFromEvents.length === 0) {
    const v = getEntryMoodValue(entry);
    if (v != null) {
      return {
        hasData: true,
        avgValue: v,
        avgRounded: v,
        firstValue: v,
        lastValue: v,
        minValue: v,
        maxValue: v,
        volatility: 0,
        samples: 1,
        label: moodValueToLabel(v),
        stabilityLabel: '安定していた日',
      };
    }

    // 何もデータがない場合
    return {
      hasData: false,
      avgValue: null,
      avgRounded: null,
      firstValue: null,
      lastValue: null,
      minValue: null,
      maxValue: null,
      volatility: null,
      samples: 0,
      label: '—',
      stabilityLabel: 'データなし',
    };
  }

  // 3) イベントが複数ある場合 → 時刻順にソート
  const eventsWithValue = moodEvents
    .map((ev, idx) => {
      const value = convertTimelineMoodToScore(ev);
      return {
        event: ev,
        value,
        index: idx,
      };
    })
    .filter(item => item.value != null) as {
    event: TimelineEvent;
    value: number;
    index: number;
  }[];

  eventsWithValue.sort((a, b) => {
    const ta = a.event.time ?? '';
    const tb = b.event.time ?? '';
    if (ta < tb) return -1;
    if (ta > tb) return 1;
    // time がない or 同じなら、元の順番で
    return a.index - b.index;
  });

  const values = eventsWithValue.map(item => item.value);
  const samples = values.length;

  const sum = values.reduce((acc, v) => acc + v, 0);
  const avgRaw = sum / samples;
  const avgRounded = roundMoodAverage(avgRaw);

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const volatility = maxValue - minValue;
  const stabilityLabel = volatilityToStabilityLabel(volatility);

  const firstValue = values[0] ?? null;
  const lastValue = values[values.length - 1] ?? null;

  return {
    hasData: true,
    avgValue: avgRaw,
    avgRounded,
    firstValue,
    lastValue,
    minValue,
    maxValue,
    volatility,
    samples,
    label: moodValueToLabel(avgRounded),
    stabilityLabel,
  };
}

// =======================
//  SleepStats の生成
// =======================

function computeSleepMinutes(
  entry: SerenoteEntry,
  prevEntry?: SerenoteEntry | null
): number | null {
  const bedFromPrev = prevEntry?.sleep?.bedTime ?? null;
  const bedFromSame = entry.sleep?.bedTime ?? null;
  const wake = entry.sleep?.wakeTime ?? null;

  const bedStr = bedFromPrev ?? bedFromSame;
  if (!bedStr || !wake) return null;

  const bedMin = parseTimeToMinutes(bedStr);
  const wakeMin = parseTimeToMinutes(wake);
  if (bedMin == null || wakeMin == null) return null;

  let diff = wakeMin - bedMin;
  if (diff < 0) {
    // 日またぎを考慮（23:00 → 07:00 など）
    diff += 24 * 60;
  }

  // 30分未満は異常値扱いで null にしても良いが、
  // ここではそのまま返す
  return diff;
}

function sleepMinutesToQualityTag(
  totalMinutes: number | null
): SleepQualityTag {
  if (totalMinutes == null) return 'データなし';

  // しきい値は仮： <6h, 6〜9h, >9h
  if (totalMinutes < 360) return '少なめ';
  if (totalMinutes <= 540) return 'ちょうど良い';
  return '多め';
}

function buildSleepStats(
  entry: SerenoteEntry,
  prevEntry?: SerenoteEntry | null
): SleepStats {
  const totalMinutes = computeSleepMinutes(entry, prevEntry);
  if (totalMinutes == null) {
    return {
      hasData: false,
      totalMinutes: null,
      hours: null,
      label: '—',
      qualityTag: 'データなし',
    };
  }

  const hours = totalMinutes / 60;
  const label = `${hours.toFixed(1)}h`;
  const qualityTag = sleepMinutesToQualityTag(totalMinutes);

  return {
    hasData: true,
    totalMinutes,
    hours,
    label,
    qualityTag,
  };
}

// =======================
//  MedStats / NoteStats
// =======================

function buildMedStats(entry: SerenoteEntry): MedStats {
  const count = entry.medications?.length ?? 0;
  return { count };
}

function buildNoteStats(entry: SerenoteEntry): NoteStats {
  const notesCount = entry.notes?.length ?? 0;
  const symptomsCount = entry.symptoms?.length ?? 0;
  const totalEvents = notesCount + symptomsCount;
  return {
    notesCount,
    symptomsCount,
    totalEvents,
  };
}

// =======================
//  公開 API
// =======================

export type DailyStatsOptions = {
  prevEntry?: SerenoteEntry | null;
  moodEventsForDate?: TimelineEvent[]; // その日のタイムラインから mood イベントだけ渡してもOK
};

/**
 * 1日分の SerenoteEntry (+ mood イベント) から DailyStats を生成
 */
export function buildDailyStatsForDate(
  date: DateKey,
  entry: SerenoteEntry,
  options?: DailyStatsOptions
): DailyStats {
  const prevEntry = options?.prevEntry ?? null;
  const moodEventsForDate = options?.moodEventsForDate ?? [];

  const mood = buildMoodStats(entry, moodEventsForDate);
  const sleep = buildSleepStats(entry, prevEntry);
  const meds = buildMedStats(entry);
  const notes = buildNoteStats(entry);

  return {
    date,
    mood,
    sleep,
    meds,
    notes,
  };
}

/**
 * 全エントリから DailyStatsMap を作成
 *
 * moodEventsByDate を渡せば、1日複数 mood を平均などに反映できる。
 * （何も渡さなければ entry.mood.value を単一の値として使う）
 */
export function buildDailyStatsMap(
  allEntries: SerenoteEntryMap,
  moodEventsByDate?: Record<DateKey, TimelineEvent[]>
): DailyStatsMap {
  const result: DailyStatsMap = {};

  const dates = Object.keys(allEntries).sort(); // 古い順
  for (const date of dates) {
    const entry = allEntries[date as DateKey];
    if (!entry) continue;

    const prevKey = getPrevDateKey(date as DateKey);
    const prevEntry = allEntries[prevKey];

    const moodEventsForDate = moodEventsByDate?.[date as DateKey] ?? [];

    const stats = buildDailyStatsForDate(date as DateKey, entry, {
      prevEntry,
      moodEventsForDate,
    });

    result[date as DateKey] = stats;
  }

  return result;
}