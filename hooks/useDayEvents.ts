// hooks/useDayEvents.ts

import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useState } from 'react';

// ✅ Storage からは「読み書き系」だけ
import {
  loadEntryForDate,
  saveEntryForDate,
} from '../src/storage/serenoteStorage';

// ✅ createEmptySerenoteEntry は types から
import {
  DateKey,
  SerenoteEntry,
  SerenoteMedicationLog,
  SerenoteMood,
  SerenoteNote,
  SerenoteSleep,
  SerenoteSymptomLog,
  createEmptySerenoteEntry,
} from '../src/types/serenote';

import type { SerenoteMoodValue } from '../src/types/mood';
import type { TimelineEvent } from '../src/types/timeline';

/**
 * 今日の日付キーを YYYY-MM-DD 形式で返すユーティリティ。
 * 例: "2025-12-01"
 */
export function getTodayKey(): DateKey {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

type UseDayEventsOptions = {
  initialEvents?: TimelineEvent[];
};

type UseDayEventsResult = {
  /** 1日分の構造化データ（mood / sleep / meds / ...） */
  entry: SerenoteEntry | null;
  setEntry: Dispatch<SetStateAction<SerenoteEntry | null>>;

  /** タイムライン用の生データ */
  events: TimelineEvent[];
  setEvents: Dispatch<SetStateAction<TimelineEvent[]>>;

  /** ストレージからの読込が終わったかどうか */
  loaded: boolean;
};

/**
 * ラベル → SerenoteMoodValue への変換（既存の日本語ラベルに合わせる）
 * ※ 古いデータで moodValue が無い場合のフォールバック用
 */
function moodLabelToValue(label: string): SerenoteMoodValue {
  switch (label) {
    case 'とてもつらい':
      return -2;
    case 'つらい':
      return -1;
    case 'ふつう':
      return 0;
    case '少し良い':
      return 1;
    case 'とても良い':
      return 2;
    default:
      return 0;
  }
}

/**
 * TimelineEvent[] から SerenoteEntry の各フィールドを構築する。
 * - mood / sleep / medications / symptoms / notes を events から再計算
 * - createdAt は既存のものを維持
 */
function buildEntryFromEvents(
  dateKey: DateKey,
  events: TimelineEvent[],
  prevEntry?: SerenoteEntry | null,
): SerenoteEntry {
  const base: SerenoteEntry = prevEntry ?? createEmptySerenoteEntry(dateKey);

  // --- mood ---
  let mood: SerenoteMood | null | undefined = base.mood;
  const moodEvents = events.filter((e) => e.type === 'mood');

  if (moodEvents.length > 0) {
    const last = moodEvents[moodEvents.length - 1];

    // ① 新フォーマット: moodValue (-2〜+2) を優先
    // ② それが無い古いイベントは label から変換
    const value: SerenoteMoodValue =
      typeof last.moodValue === 'number'
        ? last.moodValue
        : moodLabelToValue(last.label ?? '');

    mood = {
      value,
      time: last.time ?? null,
      memo: last.memo ?? null,
    };
  } else {
    // その日の mood イベントが一つも無ければ mood は undefined 扱い
    mood = undefined;
  }

  // --- sleep ---
  let sleep: SerenoteSleep | null | undefined = base.sleep ?? {};
  const sleepEvents = events.filter(
    (e) => e.type === 'sleep' || e.type === 'wake',
  );

  if (sleepEvents.length > 0) {
    const lastSleep = sleepEvents
      .filter((e) => e.type === 'sleep')
      .slice(-1)[0];
    const lastWake = sleepEvents
      .filter((e) => e.type === 'wake')
      .slice(-1)[0];

    sleep = {
      bedTime: lastSleep?.time ?? sleep?.bedTime ?? null,
      wakeTime: lastWake?.time ?? sleep?.wakeTime ?? null,
      memo: sleep?.memo ?? null,
    };
  } else if (!base.sleep) {
    sleep = undefined;
  }

  // --- medications ---
  const medEvents = events.filter((e) => e.type === 'med');
  const medications: SerenoteMedicationLog[] = medEvents.map((e) => ({
    id: e.id,
    time: e.time ?? '00:00',
    label: e.label || 'お薬',
    memo: e.memo ?? null,
  }));

  // --- symptoms ---
  const symptomEvents = events.filter((e) => e.type === 'symptom');
  const symptoms: SerenoteSymptomLog[] = symptomEvents.map((e) => ({
    id: e.id,
    time: e.time ?? '00:00',
    label: e.label ?? '症状',
    memo: e.memo ?? null,
    forDoctor: e.forDoctor ?? false,
  }));

  // --- notes ---
  const noteEvents = events.filter((e) => e.type === 'note');
  const notes: SerenoteNote[] = noteEvents.map((e) => ({
    id: e.id,
    time: e.time ?? '00:00',
    text: e.label ?? '',
  }));

  const now = new Date().toISOString();

  return {
    ...base,
    date: dateKey,
    mood,
    sleep,
    medications,
    symptoms,
    notes,
    timelineEvents: events,
    createdAt: base.createdAt ?? now,
    updatedAt: now,
  };
}

/**
 * ある1日（dateKey）に紐づく TimelineEvent[] と SerenoteEntry を
 * 一括で管理するカスタムフック。
 */
export function useDayEvents(
  dateKey: DateKey,
  options?: UseDayEventsOptions,
): UseDayEventsResult {
  const [entry, setEntry] = useState<SerenoteEntry | null>(null);
  const [events, _setEvents] = useState<TimelineEvent[]>(
    options?.initialEvents ?? [],
  );
  const [loaded, setLoaded] = useState(false);

  // 日付が変わったとき or 初回マウント時に、その日のエントリを読み込む
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const loadedEntry = await loadEntryForDate(dateKey);
        if (cancelled) return;

        setEntry(loadedEntry);

        if (loadedEntry && Array.isArray(loadedEntry.timelineEvents)) {
          _setEvents(loadedEntry.timelineEvents);
        } else if (options?.initialEvents) {
          _setEvents(options.initialEvents);
        } else {
          _setEvents([]);
        }
      } catch (e) {
        console.warn('Failed to load day events', e);
        if (!cancelled) {
          setEntry(createEmptySerenoteEntry(dateKey));
          _setEvents(options?.initialEvents ?? []);
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dateKey, options?.initialEvents]);

  /**
   * events を更新しつつ、SerenoteEntry も再計算して永続化する。
   * 普通の setState と同じように使える。
   */
  const setEvents: Dispatch<SetStateAction<TimelineEvent[]>> = useCallback(
    (updater) => {
      _setEvents((prev) => {
        const next =
          typeof updater === 'function'
            ? (updater as (prev: TimelineEvent[]) => TimelineEvent[])(prev)
            : updater;

        // entry を再構築して保存
        setEntry((prevEntry) => {
          const rebuilt = buildEntryFromEvents(dateKey, next, prevEntry);
          saveEntryForDate(rebuilt).catch((e) => {
            console.warn('Failed to save day events', e);
          });
          return rebuilt;
        });

        return next;
      });
    },
    [dateKey],
  );

  return {
    entry,
    setEntry,
    events,
    setEvents,
    loaded,
  };
}