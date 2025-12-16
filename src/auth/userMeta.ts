// src/auth/userMeta.ts
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * ユーザーのメタ情報を Firestore に残す
 * - 初回: createdAt を保存
 * - 毎回: lastLoginAt を更新
 */
export async function upsertUserMeta(uid: string) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    await setDoc(
      ref,
      {
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}