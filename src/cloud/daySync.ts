// src/cloud/daySync.ts
import { auth, db } from '@/src/firebase';
import {
    collection,
    doc,
    getDocs,
    serverTimestamp,
    setDoc,
    writeBatch,
    type DocumentData,
} from 'firebase/firestore';

// 既存の型に合わせて import パス調整してOK
import type { TimelineEvent } from '@/src/types/timeline';

export type DateKey = string; // "YYYY-MM-DD"

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  return uid;
}

function dayDocRef(uid: string, dateKey: DateKey) {
  return doc(db, 'users', uid, 'days', dateKey);
}

function eventsColRef(uid: string, dateKey: DateKey) {
  return collection(db, 'users', uid, 'days', dateKey, 'events');
}

/**
 * ✅ Dayメタを upsert（updatedAt / createdAt）
 */
export async function upsertDayMeta(dateKey: DateKey) {
  const uid = requireUid();
  const ref = dayDocRef(uid, dateKey);

  // merge で createdAt を潰さない
  await setDoc(
    ref,
    {
      dateKey,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * ✅ 1日分のイベントをクラウドに保存（サブコレ events）
 * - 既存: events は「そのまま全部アップロード」する最小実装
 * - 後で差分同期（追加/更新/削除）に拡張できる
 */
export async function uploadDayEvents(dateKey: DateKey, events: TimelineEvent[]) {
  const uid = requireUid();

  // dayメタを更新
  await upsertDayMeta(dateKey);

  // events をまとめて書く（バッチ）
  const batch = writeBatch(db);
  const col = eventsColRef(uid, dateKey);

  for (const ev of events) {
    if (!ev?.id) continue;

    const ref = doc(col, ev.id);

    // Firestoreには plain object で入れる（Dateなどは避ける）
    // ev の中身がすでにシリアライズ可能ならこのままでOK
    const data: DocumentData = {
      ...ev,
      id: ev.id, // 念のため保持
      dateKey,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    batch.set(ref, data, { merge: true });
  }

  await batch.commit();
}

/**
 * ✅ 1日分のイベントをクラウドから取得
 */
export async function downloadDayEvents(dateKey: DateKey): Promise<TimelineEvent[]> {
  const uid = requireUid();
  const col = eventsColRef(uid, dateKey);

  const snap = await getDocs(col);

  const events: TimelineEvent[] = [];
  snap.forEach((d) => {
    const data = d.data() as any;

    // Firestore内の createdAt/updatedAt は Timestamp になるので、
    // UIで使わないならそのまま捨ててOK
    const { createdAt, updatedAt, ...rest } = data;

    // id は docId を優先
    events.push({
      ...rest,
      id: d.id,
    } as TimelineEvent);
  });

  return events;
}

/**
 * ✅ 単発削除（必要なら）
 */
export async function deleteDayEvent(dateKey: DateKey, eventId: string) {
  const uid = requireUid();
  const ref = doc(db, 'users', uid, 'days', dateKey, 'events', eventId);
  // 完全削除にしたいなら deleteDoc を使う
  // ただし import 追加が必要なので、まず論理削除にしてる
  await setDoc(ref, { deletedAt: Date.now(), updatedAt: serverTimestamp() }, { merge: true });
}