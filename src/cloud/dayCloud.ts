// src/cloud/dayCloud.ts
import type { Timestamp } from 'firebase/firestore';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
    setDoc,
    type DocumentData,
} from 'firebase/firestore';

import { auth, db } from '@/src/firebase';
import { loadAllEntries, saveAllEntries } from '@/src/storage/serenoteStorage';
import type { DateKey, SerenoteEntry, SerenoteEntryMap } from '@/src/types/serenote';

/**
 * Firestore に保存する「1日分ドキュメント」の形
 * - Timestamp は Firestore 側の createdAt/updatedAt 用
 * - entry の中身は “生データ” をそのまま置く（集計はアプリ側）
 */
export type DayDoc = {
  schemaVersion: number; // 後で移行が必要になった時のため
  date: DateKey;

  // SerenoteEntry の中身（生データ）
  mood?: SerenoteEntry['mood'] | null;
  sleep?: SerenoteEntry['sleep'] | null;
  medications?: SerenoteEntry['medications'];
  symptoms?: SerenoteEntry['symptoms'];
  notes?: SerenoteEntry['notes'];
  timelineEvents?: SerenoteEntry['timelineEvents'];

  // メタ
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

const DAY_SCHEMA_VERSION = 1;

/** users/{uid}/days/{dateKey} の参照を作る */
function dayRef(uid: string, dateKey: DateKey) {
  return doc(db, 'users', uid, 'days', dateKey);
}

/** ローカルEntry → Firestore DayDoc */
function entryToDayDoc(entry: SerenoteEntry): Omit<DayDoc, 'createdAt' | 'updatedAt'> {
  return {
    schemaVersion: DAY_SCHEMA_VERSION,
    date: entry.date,
    mood: entry.mood ?? null,
    sleep: entry.sleep ?? null,
    medications: entry.medications ?? [],
    symptoms: entry.symptoms ?? [],
    notes: entry.notes ?? [],
    timelineEvents: entry.timelineEvents ?? [],
  };
}

/** Firestore DayDoc → ローカルEntry */
function dayDocToEntry(date: DateKey, data: DocumentData): SerenoteEntry {
  // 型は “信用しすぎない” で最低限の形だけ整える
  const entry: SerenoteEntry = {
    date,
    mood: data.mood ?? undefined,
    sleep: data.sleep ?? undefined,
    medications: Array.isArray(data.medications) ? data.medications : [],
    symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
    notes: Array.isArray(data.notes) ? data.notes : [],
    timelineEvents: Array.isArray(data.timelineEvents) ? data.timelineEvents : [],
    // createdAt/updatedAt はローカルは ISO 文字列で持ってるので、ここは “復元時に今” を入れる
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return entry;
}

/**
 * ✅ saveDayToCloud(dateKey)
 * ローカルにある “その日” をクラウドに保存する
 *
 * options.requireNonAnonymous = true（推奨）
 *   → Googleログイン済みユーザーだけクラウド保存したい、の要望に対応
 */
export async function saveDayToCloud(
  dateKey: DateKey,
  options?: { requireNonAnonymous?: boolean }
) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  const requireNonAnonymous = options?.requireNonAnonymous ?? true;
  if (requireNonAnonymous && user.isAnonymous) {
    throw new Error('Anonymous user: cloud backup requires Google sign-in');
  }

  // ローカルから当日分を取る
  const map = await loadAllEntries();
  const entry = map?.[dateKey];

  if (!entry) {
    // 「その日何もない」のを保存するかは好み。
    // ここでは “保存しない” にして、無駄なドキュメント作成を避ける。
    return { ok: true, skipped: true, reason: 'no-local-entry' as const };
  }

  const ref = dayRef(user.uid, dateKey);

  // createdAt は初回だけ付けたいので、存在チェックして分岐
  const snap = await getDoc(ref);

  const payload = {
    ...entryToDayDoc(entry),
    updatedAt: serverTimestamp(),
    ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
  };

  await setDoc(ref, payload, { merge: true });

  return { ok: true, skipped: false };
}

/**
 * ✅ restoreAllDaysFromCloud()
 * クラウド（users/{uid}/days/*）を全部読み込んでローカルに復元する
 *
 * 重要:
 * - “毎回自動復元” はコスト/UX的にしない（あなたの方針通り）
 * - 設定画面の「復元」ボタンから手動実行するのがベスト
 */
export async function restoreAllDaysFromCloud(options?: {
  requireNonAnonymous?: boolean;
  /**
   * true: ローカルを優先（同じdateKeyがあればローカル保持）
   * false: クラウドで上書き
   */
  preferLocal?: boolean;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  const requireNonAnonymous = options?.requireNonAnonymous ?? true;
  if (requireNonAnonymous && user.isAnonymous) {
    throw new Error('Anonymous user: restore requires Google sign-in');
  }

  const preferLocal = options?.preferLocal ?? false;

  // 既存ローカル
  const localMap: SerenoteEntryMap = (await loadAllEntries()) ?? {};

  // クラウド全件
  const daysCol = collection(db, 'users', user.uid, 'days');
  const snap = await getDocs(daysCol);

  let restored = 0;
  const nextMap: SerenoteEntryMap = { ...localMap };

  snap.forEach(d => {
    const dateKey = d.id as DateKey;
    const data = d.data();

    // ローカル優先ならスキップ
    if (preferLocal && nextMap[dateKey]) return;

    nextMap[dateKey] = dayDocToEntry(dateKey, data);
    restored += 1;
  });

  // ローカルに保存
  await saveAllEntries(nextMap);

  return {
    ok: true,
    restoredCount: restored,
    cloudCount: snap.size,
  };
}