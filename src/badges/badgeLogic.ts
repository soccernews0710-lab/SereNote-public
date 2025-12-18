// src/badges/badgeLogic.ts
// バッジの達成判定ロジック

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SerenoteEntryMap, DateKey } from '../types/serenote';
import {
  BADGE_DEFINITIONS,
  type BadgeId,
  type BadgeDefinition,
} from './badgeDefinitions';
import { getTodayDateKey, getPrevDateKey } from '../utils/dateKey';

// ストレージキー
const BADGE_STORAGE_KEY = 'serenote_achieved_badges_v1';
const BREATHING_COUNT_KEY = 'serenote_breathing_count_v1';

/**
 * 達成済みバッジの情報
 */
export interface AchievedBadge {
  id: BadgeId;
  achievedAt: string; // ISO日付
}

/**
 * バッジの進捗情報
 */
export interface BadgeProgress {
  badge: BadgeDefinition;
  isAchieved: boolean;
  achievedAt?: string;
  currentValue: number;
  progress: number; // 0〜1
}

/**
 * バッジ計算用の統計
 */
export interface BadgeStats {
  // 連続記録日数（現在）
  currentStreak: number;
  // 総記録日数
  totalRecordDays: number;
  // 睡眠記録日数
  sleepRecordDays: number;
  // 服薬記録日数
  medRecordDays: number;
  // 気分記録日数
  moodRecordDays: number;
  // メモ・症状の総数
  totalNotesAndSymptoms: number;
  // 行動記録日数
  activityRecordDays: number;
  // 呼吸エクササイズ回数
  breathingCount: number;
  // 早起き（6時前）記録があるか
  hasEarlyBird: boolean;
  // 夜更かし（0時以降）記録があるか
  hasNightOwl: boolean;
}

/**
 * 達成済みバッジを読み込む
 */
export async function loadAchievedBadges(): Promise<AchievedBadge[]> {
  try {
    const json = await AsyncStorage.getItem(BADGE_STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json) as AchievedBadge[];
  } catch (e) {
    console.warn('Failed to load achieved badges', e);
    return [];
  }
}

/**
 * 達成済みバッジを保存する
 */
export async function saveAchievedBadges(badges: AchievedBadge[]): Promise<void> {
  try {
    await AsyncStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(badges));
  } catch (e) {
    console.warn('Failed to save achieved badges', e);
  }
}

/**
 * 新しいバッジを達成としてマーク
 */
export async function markBadgeAchieved(badgeId: BadgeId): Promise<AchievedBadge[]> {
  const achieved = await loadAchievedBadges();
  
  // 既に達成済みなら何もしない
  if (achieved.some(b => b.id === badgeId)) {
    return achieved;
  }

  const newBadge: AchievedBadge = {
    id: badgeId,
    achievedAt: new Date().toISOString(),
  };

  const updated = [...achieved, newBadge];
  await saveAchievedBadges(updated);
  return updated;
}

/**
 * 呼吸エクササイズのカウントを取得
 */
export async function getBreathingCount(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(BREATHING_COUNT_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * 呼吸エクササイズのカウントを増やす
 */
export async function incrementBreathingCount(): Promise<number> {
  const current = await getBreathingCount();
  const next = current + 1;
  try {
    await AsyncStorage.setItem(BREATHING_COUNT_KEY, String(next));
  } catch (e) {
    console.warn('Failed to save breathing count', e);
  }
  return next;
}

/**
 * エントリデータからバッジ用の統計を計算
 */
export function calculateBadgeStats(
  allEntries: SerenoteEntryMap,
  breathingCount: number
): BadgeStats {
  const dateKeys = Object.keys(allEntries).sort() as DateKey[];

  let totalRecordDays = 0;
  let sleepRecordDays = 0;
  let medRecordDays = 0;
  let moodRecordDays = 0;
  let totalNotesAndSymptoms = 0;
  let activityRecordDays = 0;
  let hasEarlyBird = false;
  let hasNightOwl = false;

  dateKeys.forEach(dateKey => {
    const entry = allEntries[dateKey];
    if (!entry) return;

    let hasAnyRecord = false;

    // 睡眠
    if (entry.sleep?.wakeTime || entry.sleep?.bedTime) {
      sleepRecordDays++;
      hasAnyRecord = true;

      // 早起きチェック（6時前）
      const wakeTime = entry.sleep?.wakeTime;
      if (wakeTime) {
        const hour = parseInt(wakeTime.split(':')[0], 10);
        if (!isNaN(hour) && hour < 6) {
          hasEarlyBird = true;
        }
      }

      // 夜更かしチェック（0時以降）
      const bedTime = entry.sleep?.bedTime;
      if (bedTime) {
        const hour = parseInt(bedTime.split(':')[0], 10);
        if (!isNaN(hour) && hour >= 0 && hour < 5) {
          hasNightOwl = true;
        }
      }
    }

    // 服薬
    if (entry.medications && entry.medications.length > 0) {
      medRecordDays++;
      hasAnyRecord = true;
    }

    // 気分
    if (entry.mood?.value != null) {
      moodRecordDays++;
      hasAnyRecord = true;
    }

    // メモ・症状
    const notesCount = entry.notes?.length ?? 0;
    const symptomsCount = entry.symptoms?.length ?? 0;
    totalNotesAndSymptoms += notesCount + symptomsCount;
    if (notesCount > 0 || symptomsCount > 0) {
      hasAnyRecord = true;
    }

    // 行動（timelineEventsから）
    const events = (entry as any).timelineEvents ?? [];
    const hasActivity = events.some((e: any) => e.type === 'activity');
    if (hasActivity) {
      activityRecordDays++;
      hasAnyRecord = true;
    }

    if (hasAnyRecord) {
      totalRecordDays++;
    }
  });

  // 連続記録日数を計算
  const currentStreak = calculateCurrentStreak(allEntries);

  return {
    currentStreak,
    totalRecordDays,
    sleepRecordDays,
    medRecordDays,
    moodRecordDays,
    totalNotesAndSymptoms,
    activityRecordDays,
    breathingCount,
    hasEarlyBird,
    hasNightOwl,
  };
}

/**
 * 現在の連続記録日数を計算
 */
function calculateCurrentStreak(allEntries: SerenoteEntryMap): number {
  let streak = 0;
  let currentDate = getTodayDateKey();

  // 今日から遡ってチェック
  while (true) {
    const entry = allEntries[currentDate];
    
    // その日に何か記録があるかチェック
    const hasRecord = entry && hasAnyRecordInEntry(entry);

    if (hasRecord) {
      streak++;
      currentDate = getPrevDateKey(currentDate);
    } else {
      // 今日の場合は、まだ記録してないだけかもしれないので、
      // 昨日からチェックし直す
      if (streak === 0) {
        currentDate = getPrevDateKey(getTodayDateKey());
        const yesterdayEntry = allEntries[currentDate];
        if (yesterdayEntry && hasAnyRecordInEntry(yesterdayEntry)) {
          streak++;
          currentDate = getPrevDateKey(currentDate);
          continue;
        }
      }
      break;
    }
  }

  return streak;
}

/**
 * エントリに何らかの記録があるかチェック
 */
function hasAnyRecordInEntry(entry: any): boolean {
  if (!entry) return false;

  // 睡眠
  if (entry.sleep?.wakeTime || entry.sleep?.bedTime) return true;

  // 服薬
  if (entry.medications && entry.medications.length > 0) return true;

  // 気分
  if (entry.mood?.value != null) return true;

  // メモ
  if (entry.notes && entry.notes.length > 0) return true;

  // 症状
  if (entry.symptoms && entry.symptoms.length > 0) return true;

  // タイムラインイベント
  if (entry.timelineEvents && entry.timelineEvents.length > 0) return true;

  return false;
}

/**
 * 全バッジの進捗を計算
 */
export function calculateAllBadgeProgress(
  stats: BadgeStats,
  achievedBadges: AchievedBadge[]
): BadgeProgress[] {
  const achievedMap = new Map(
    achievedBadges.map(b => [b.id, b.achievedAt])
  );

  return BADGE_DEFINITIONS.map(badge => {
    const isAchieved = achievedMap.has(badge.id);
    const achievedAt = achievedMap.get(badge.id);

    let currentValue = 0;

    // バッジIDに応じて現在値を計算
    switch (badge.id) {
      case 'first_record':
        currentValue = stats.totalRecordDays > 0 ? 1 : 0;
        break;
      case 'streak_3':
      case 'streak_7':
      case 'streak_14':
      case 'streak_30':
      case 'streak_60':
      case 'streak_90':
        currentValue = stats.currentStreak;
        break;
      case 'sleep_master_7':
      case 'sleep_master_14':
        currentValue = stats.sleepRecordDays;
        break;
      case 'med_habit_7':
      case 'med_habit_14':
      case 'med_habit_30':
        currentValue = stats.medRecordDays;
        break;
      case 'mood_tracker_7':
      case 'mood_tracker_30':
        currentValue = stats.moodRecordDays;
        break;
      case 'note_writer_10':
      case 'note_writer_30':
      case 'note_writer_100':
        currentValue = stats.totalNotesAndSymptoms;
        break;
      case 'activity_logger_7':
        currentValue = stats.activityRecordDays;
        break;
      case 'breathing_first':
      case 'breathing_10':
        currentValue = stats.breathingCount;
        break;
      case 'early_bird':
        currentValue = stats.hasEarlyBird ? 1 : 0;
        break;
      case 'night_owl':
        currentValue = stats.hasNightOwl ? 1 : 0;
        break;
      default:
        currentValue = 0;
    }

    const progress = Math.min(1, currentValue / badge.requirement);

    return {
      badge,
      isAchieved,
      achievedAt,
      currentValue,
      progress,
    };
  });
}

/**
 * 新しく達成したバッジをチェックして保存
 * 戻り値: 新しく達成したバッジのリスト
 */
export async function checkAndUpdateBadges(
  stats: BadgeStats
): Promise<BadgeDefinition[]> {
  const achievedBadges = await loadAchievedBadges();
  const achievedIds = new Set(achievedBadges.map(b => b.id));

  const newlyAchieved: BadgeDefinition[] = [];

  const progressList = calculateAllBadgeProgress(stats, achievedBadges);

  for (const item of progressList) {
    // 既に達成済みならスキップ
    if (achievedIds.has(item.badge.id)) continue;

    // 条件を満たしているか
    if (item.currentValue >= item.badge.requirement) {
      await markBadgeAchieved(item.badge.id);
      newlyAchieved.push(item.badge);
    }
  }

  return newlyAchieved;
}
