// src/stats/weeklyReportLogic.ts
// 週間レポート用のインサイト（気づき）生成ロジック

import type { StatsRow } from './statsLogic';

/**
 * 週間レポートのサマリーデータ
 */
export type WeeklyReportSummary = {
  // 記録率
  totalDays: number;
  daysWithRecord: number;
  recordRate: number; // 0〜1

  // 気分
  avgMood: number | null; // 1〜5
  minMood: number | null;
  maxMood: number | null;
  moodTrend: 'up' | 'down' | 'stable' | 'unknown';
  moodStability: 'stable' | 'slightly_unstable' | 'unstable' | 'unknown';

  // 睡眠
  avgSleepHours: number | null;
  minSleepHours: number | null;
  maxSleepHours: number | null;
  sleepConsistency: 'consistent' | 'slightly_inconsistent' | 'inconsistent' | 'unknown';

  // 服薬
  daysWithMeds: number;
  medRecordRate: number; // 0〜1

  // 行動
  totalActivityMinutes: number;
  daysWithActivity: number;

  // メモ・症状
  totalNotes: number;
  totalSymptoms: number;
};

/**
 * 週間レポートのインサイト
 */
export type WeeklyInsight = {
  type: 'positive' | 'neutral' | 'concern' | 'encouragement';
  icon: string;
  title: string;
  message: string;
};

/**
 * StatsRow[] から WeeklyReportSummary を生成
 */
export function buildWeeklyReportSummary(rows: StatsRow[]): WeeklyReportSummary {
  const totalDays = rows.length;

  // 記録がある日をカウント
  const daysWithRecord = rows.filter(r => {
    return (
      r.moodAvg != null ||
      r.sleepMinutes != null ||
      r.medsCount > 0 ||
      r.notesCount > 0 ||
      r.symptomsCount > 0 ||
      r.activityMinutes > 0
    );
  }).length;

  const recordRate = totalDays > 0 ? daysWithRecord / totalDays : 0;

  // 気分
  const moodValues = rows.map(r => r.moodAvg).filter((v): v is number => v != null);
  const avgMood = moodValues.length > 0
    ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length
    : null;
  const minMood = moodValues.length > 0 ? Math.min(...moodValues) : null;
  const maxMood = moodValues.length > 0 ? Math.max(...moodValues) : null;

  // 気分トレンド（前半 vs 後半）
  const moodTrend = calcMoodTrend(rows);
  const moodStability = calcMoodStability(moodValues);

  // 睡眠
  const sleepValues = rows.map(r => r.sleepMinutes).filter((v): v is number => v != null);
  const avgSleepMinutes = sleepValues.length > 0
    ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length
    : null;
  const avgSleepHours = avgSleepMinutes != null ? avgSleepMinutes / 60 : null;
  const minSleepHours = sleepValues.length > 0 ? Math.min(...sleepValues) / 60 : null;
  const maxSleepHours = sleepValues.length > 0 ? Math.max(...sleepValues) / 60 : null;
  const sleepConsistency = calcSleepConsistency(sleepValues);

  // 服薬
  const daysWithMeds = rows.filter(r => r.medsCount > 0).length;
  const medRecordRate = totalDays > 0 ? daysWithMeds / totalDays : 0;

  // 行動
  const totalActivityMinutes = rows.reduce((acc, r) => acc + r.activityMinutes, 0);
  const daysWithActivity = rows.filter(r => r.activityMinutes > 0).length;

  // メモ・症状
  const totalNotes = rows.reduce((acc, r) => acc + r.notesCount, 0);
  const totalSymptoms = rows.reduce((acc, r) => acc + r.symptomsCount, 0);

  return {
    totalDays,
    daysWithRecord,
    recordRate,
    avgMood,
    minMood,
    maxMood,
    moodTrend,
    moodStability,
    avgSleepHours,
    minSleepHours,
    maxSleepHours,
    sleepConsistency,
    daysWithMeds,
    medRecordRate,
    totalActivityMinutes,
    daysWithActivity,
    totalNotes,
    totalSymptoms,
  };
}

/**
 * 気分のトレンド（前半 vs 後半）
 */
function calcMoodTrend(rows: StatsRow[]): 'up' | 'down' | 'stable' | 'unknown' {
  const moodRows = rows.filter(r => r.moodAvg != null);
  if (moodRows.length < 3) return 'unknown';

  const mid = Math.floor(moodRows.length / 2);
  const firstHalf = moodRows.slice(0, mid);
  const secondHalf = moodRows.slice(mid);

  const avgFirst = firstHalf.reduce((acc, r) => acc + (r.moodAvg ?? 0), 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((acc, r) => acc + (r.moodAvg ?? 0), 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;

  if (diff > 0.3) return 'up';
  if (diff < -0.3) return 'down';
  return 'stable';
}

/**
 * 気分の安定度
 */
function calcMoodStability(values: number[]): 'stable' | 'slightly_unstable' | 'unstable' | 'unknown' {
  if (values.length < 2) return 'unknown';

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  if (range <= 1) return 'stable';
  if (range <= 2) return 'slightly_unstable';
  return 'unstable';
}

/**
 * 睡眠の一貫性
 */
function calcSleepConsistency(
  minutesValues: number[]
): 'consistent' | 'slightly_inconsistent' | 'inconsistent' | 'unknown' {
  if (minutesValues.length < 2) return 'unknown';

  const max = Math.max(...minutesValues);
  const min = Math.min(...minutesValues);
  const rangeHours = (max - min) / 60;

  if (rangeHours <= 1.5) return 'consistent';
  if (rangeHours <= 3) return 'slightly_inconsistent';
  return 'inconsistent';
}

/**
 * サマリーからインサイト（気づき）を生成
 */
export function generateWeeklyInsights(summary: WeeklyReportSummary): WeeklyInsight[] {
  const insights: WeeklyInsight[] = [];

  // 1. 記録率に関するインサイト
  if (summary.recordRate >= 0.85) {
    insights.push({
      type: 'positive',
      icon: '🌟',
      title: '素晴らしい記録習慣！',
      message: `今週は${summary.daysWithRecord}日記録できました。継続は力なり、この調子で続けていきましょう。`,
    });
  } else if (summary.recordRate >= 0.5) {
    insights.push({
      type: 'encouragement',
      icon: '📝',
      title: '記録を続けてみよう',
      message: `今週は${summary.daysWithRecord}日記録がありました。無理のない範囲で、少しずつ続けてみてください。`,
    });
  } else if (summary.recordRate > 0) {
    insights.push({
      type: 'encouragement',
      icon: '💪',
      title: '記録を始めた一歩',
      message: '忙しい日もあったかもしれません。記録できた日があること自体が大切です。',
    });
  }

  // 2. 気分に関するインサイト
  if (summary.avgMood != null) {
    if (summary.avgMood >= 4) {
      insights.push({
        type: 'positive',
        icon: '😊',
        title: '気分が安定して良い週',
        message: '今週は全体的に気分が良い日が多かったようです。何か良いことがあったのかもしれませんね。',
      });
    } else if (summary.avgMood <= 2.5) {
      insights.push({
        type: 'concern',
        icon: '🤗',
        title: 'つらい日が多かったかも',
        message: '今週は気分が落ち込みやすい日が多かったようです。無理せず、自分を労わる時間を作ってみてください。',
      });
    }

    // 気分トレンド
    if (summary.moodTrend === 'up') {
      insights.push({
        type: 'positive',
        icon: '📈',
        title: '気分が上向き傾向',
        message: '週の後半に向けて気分が良くなっている傾向があります。',
      });
    } else if (summary.moodTrend === 'down') {
      insights.push({
        type: 'neutral',
        icon: '📉',
        title: '週末に向けて疲れが出たかも',
        message: '週の後半に気分が下がる傾向がありました。週末はゆっくり休めるといいですね。',
      });
    }

    // 気分の安定度
    if (summary.moodStability === 'unstable') {
      insights.push({
        type: 'neutral',
        icon: '🎢',
        title: '気分の波が大きかった週',
        message: '気分の上下が激しかったようです。何がきっかけだったか振り返ってみると発見があるかもしれません。',
      });
    }
  }

  // 3. 睡眠に関するインサイト
  if (summary.avgSleepHours != null) {
    if (summary.avgSleepHours >= 7 && summary.avgSleepHours <= 8) {
      insights.push({
        type: 'positive',
        icon: '😴',
        title: '理想的な睡眠時間',
        message: `平均${summary.avgSleepHours.toFixed(1)}時間の睡眠が取れています。良い睡眠習慣ですね。`,
      });
    } else if (summary.avgSleepHours < 6) {
      insights.push({
        type: 'concern',
        icon: '⏰',
        title: '睡眠が少なめかも',
        message: `平均${summary.avgSleepHours.toFixed(1)}時間と、少し睡眠が短めです。可能であれば、もう少し休める時間を確保できるといいですね。`,
      });
    } else if (summary.avgSleepHours > 9) {
      insights.push({
        type: 'neutral',
        icon: '🛏️',
        title: '睡眠時間が長め',
        message: `平均${summary.avgSleepHours.toFixed(1)}時間と、睡眠が長めです。疲れが溜まっているのかもしれません。`,
      });
    }

    if (summary.sleepConsistency === 'inconsistent') {
      insights.push({
        type: 'neutral',
        icon: '🌙',
        title: '睡眠リズムにばらつき',
        message: '日によって睡眠時間の差が大きかったようです。なるべく同じ時間に寝起きすると体調が安定しやすいかもしれません。',
      });
    }
  }

  // 4. 服薬に関するインサイト
  if (summary.medRecordRate >= 0.85) {
    insights.push({
      type: 'positive',
      icon: '💊',
      title: '服薬記録もばっちり',
      message: 'しっかり服薬の記録ができています。主治医に見せる資料としても役立ちますね。',
    });
  }

  // 5. 行動に関するインサイト
  if (summary.daysWithActivity >= 5) {
    insights.push({
      type: 'positive',
      icon: '🚶',
      title: 'アクティブな1週間',
      message: `${summary.daysWithActivity}日間、何かしらの行動を記録できました。自分の活動パターンが見えてきますね。`,
    });
  }

  // インサイトがない場合のデフォルト
  if (insights.length === 0) {
    insights.push({
      type: 'encouragement',
      icon: '🌱',
      title: 'まずは記録を続けてみよう',
      message: 'データが増えると、自分の傾向やパターンが見えてきます。焦らずゆっくり続けていきましょう。',
    });
  }

  // 最大4つまでに制限
  return insights.slice(0, 4);
}

/**
 * 気分スコア（1〜5）をラベルに変換
 */
export function moodScoreToLabel(score: number | null): string {
  if (score == null) return '—';
  if (score <= 1.5) return 'とてもつらい';
  if (score <= 2.5) return 'つらい';
  if (score <= 3.5) return 'ふつう';
  if (score <= 4.5) return '少し良い';
  return 'とても良い';
}

/**
 * 気分スコア（1〜5）を絵文字に変換
 */
export function moodScoreToEmoji(score: number | null): string {
  if (score == null) return '❓';
  const rounded = Math.round(score);
  const map: Record<number, string> = {
    1: '😭',
    2: '😣',
    3: '😐',
    4: '🙂',
    5: '😄',
  };
  return map[rounded] ?? '❓';
}
