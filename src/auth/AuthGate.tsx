// src/auth/AuthGate.tsx
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { ReactNode, useEffect } from 'react';
import { auth } from '../firebase';

export function AuthGate({ children }: { children: ReactNode }) {
  useEffect(() => {
    // 認証状態を監視
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (!user) {
        // 未ログインなら匿名ログイン
        signInAnonymously(auth).catch(error => {
          console.warn('Anonymous sign-in failed', error);
        });
      }
    });

    return unsubscribe;
  }, []);

  return <>{children}</>;
}