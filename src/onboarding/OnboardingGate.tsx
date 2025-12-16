// src/onboarding/OnboardingGate.tsx
import { usePathname, useRouter } from 'expo-router';
import React, { ReactNode, useEffect, useRef } from 'react';

import { useUserSettings } from '../../hooks/useUserSettings';

type Props = { children: ReactNode };

function isEmptyString(v: unknown): boolean {
  return typeof v !== 'string' || v.trim().length === 0;
}

export function OnboardingGate({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const { loaded, nickname } = useUserSettings();

  // 無限ループ/多重リダイレクト防止
  const redirectedRef = useRef(false);

  // ✅ nickname だけ必須
  const mustOnboard = loaded && isEmptyString(nickname);

  useEffect(() => {
    if (!loaded) return;

    // すでにオンボーディング配下なら何もしない
    if (pathname?.startsWith('/onboarding')) {
      redirectedRef.current = false;
      return;
    }

    // nickname が未設定ならオンボーディングへ
    if (mustOnboard) {
      if (redirectedRef.current) return;
      redirectedRef.current = true;

      // typedRoutes の型回避（実行は問題なし）
      router.replace('/onboarding/profile' as any);
      return;
    }

    redirectedRef.current = false;
  }, [loaded, mustOnboard, pathname, router]);

  // ロード完了までチラつき防止
  if (!loaded) return null;

  return <>{children}</>;
}