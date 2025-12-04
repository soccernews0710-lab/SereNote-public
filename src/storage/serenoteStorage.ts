// src/storage/serenoteStorage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    DateKey,
    SerenoteEntry,
    SerenoteEntryMap,
    createEmptySerenoteEntry,
} from '../types/serenote';

// 🎯 ここだけ見れば「Serenoteの保存場所」が分かるようにする
const STORAGE_KEY = 'serenote_entries_v1';

/**
 * AsyncStorage から全エントリを読み込む。
 * 失敗した場合や未保存の場合は空オブジェクトを返す。
 */
export async function loadAllEntries(): Promise<SerenoteEntryMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as SerenoteEntryMap;

    // 一応ガード：null や変な値が入っていても落ちないように
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
    return {};
  } catch (e) {
    console.warn('Failed to load Serenote entries', e);
    return {};
  }
}

/**
 * 全エントリを丸ごと保存する。
 * （通常は saveEntryForDate 経由で使う想定）
 */
export async function saveAllEntries(map: SerenoteEntryMap): Promise<void> {
  try {
    const raw = JSON.stringify(map);
    await AsyncStorage.setItem(STORAGE_KEY, raw);
  } catch (e) {
    console.warn('Failed to save Serenote entries', e);
  }
}

/**
 * 特定の日付のエントリを読み込む。
 * 既存があればそれを、なければ「空のエントリ」を返す（まだ保存はしない）。
 */
export async function loadEntryForDate(date: DateKey): Promise<SerenoteEntry> {
  const all = await loadAllEntries();
  const existing = all[date];

  if (existing) {
    return existing;
  }

  // まだ何もない日は空エントリ（未保存状態）を返す
  return createEmptySerenoteEntry(date);
}

/**
 * 1日分のエントリを保存（アップサート）する。
 * - 既存があればマージして updatedAt を更新
 * - なければ新規作成（createdAt / updatedAt をセット）
 * 保存後、確定したエントリを返す。
 */
export async function saveEntryForDate(
  entry: SerenoteEntry
): Promise<SerenoteEntry> {
  const all = await loadAllEntries();
  const now = new Date().toISOString();

  const prev = all[entry.date];

  const merged: SerenoteEntry = {
    // まず既存（あれば）をベースに
    ...(prev ?? {}),
    // 新しい値で上書き
    ...entry,
    date: entry.date,
    createdAt: prev?.createdAt ?? entry.createdAt ?? now,
    updatedAt: now,
  };

  const nextMap: SerenoteEntryMap = {
    ...all,
    [entry.date]: merged,
  };

  await saveAllEntries(nextMap);
  return merged;
}

/**
 * 特定の日付エントリを削除（Historyから消したいときなど）。
 * 何もなければ何もしない。
 */
export async function deleteEntryForDate(date: DateKey): Promise<void> {
  const all = await loadAllEntries();
  if (!all[date]) return;

  const { [date]: _, ...rest } = all;
  await saveAllEntries(rest);
}

/**
 * （開発用）全データ削除。
 * 本番では使わない or デバッグメニュー限定にする想定。
 */
export async function clearAllEntries(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear Serenote entries', e);
  }
}