// src/auth/AuthGate.tsx
import Constants from 'expo-constants';
import {
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from 'firebase/auth';
import {
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import React, {
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { auth, db } from '../firebase';
import { configureGoogleSignIn } from './googleSignIn';

type Props = { children: ReactNode };

function getGoogleWebClientId(): string {
  // ① env（EAS/Dev Build）
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (fromEnv) return fromEnv;

  // ② app.json の extra から拾う
  const extra = (Constants.expoConfig?.extra ?? {}) as any;
  const fromExtra = extra?.googleAuth?.webClientId;
  return typeof fromExtra === 'string' ? fromExtra : '';
}

/**
 * ✅ Step1: users/{uid} に createdAt / lastLoginAt を保存
 * - 初回のみ createdAt
 * - 毎回 lastLoginAt
 *
 * ※ transaction にして「初回判定」を原子的に行う（安定）
 */
async function upsertUserMeta(uid: string) {
  const ref = doc(db, 'users', uid);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    if (!snap.exists()) {
      tx.set(
        ref,
        {
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
      return;
    }

    // 既存 → lastLoginAt だけ更新
    tx.set(
      ref,
      {
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export function AuthGate({ children }: Props) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const webClientId = useMemo(() => getGoogleWebClientId(), []);

  // 同じ uid で複数回 upsert されるのを防ぐ
  const lastUpsertUidRef = useRef<string | null>(null);

  useEffect(() => {
    // ✅ Google Sign-In 初期化（アプリ起動時に1回）
    if (!webClientId) {
      console.warn(
        '[AuthGate] Google Web Client ID is missing (env or extra.googleAuth.webClientId).'
      );
    } else {
      configureGoogleSignIn({ webClientId });
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      // 未ログインなら匿名ログイン
      if (!u) {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.warn('[AuthGate] Anonymous sign-in failed', e);
        } finally {
          setReady(true);
        }
        return;
      }

      // ✅ users/{uid} メタ書き込み（uid単位で1回だけ）
      try {
        if (lastUpsertUidRef.current !== u.uid) {
          lastUpsertUidRef.current = u.uid;
          await upsertUserMeta(u.uid);
        }
      } catch (e) {
        console.warn('[AuthGate] Failed to upsert user meta', e);
      } finally {
        setReady(true);
      }
    });

    return () => unsub();
  }, [webClientId]);

  if (!ready) return null;

  return <>{children}</>;
}