// src/subscription/useSubscription.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Alert } from 'react-native';

export type SubscriptionPlan = 'free' | 'pro';

type SubscriptionContextValue = {
  plan: SubscriptionPlan;
  isPro: boolean;
  setPlan: (plan: SubscriptionPlan) => void;

  // ⭐ Pro への誘導用（課金画面ができたらここで遷移に差し替え）
  openProPaywall: () => void;
};

// 他とかぶらないようにそれっぽいキー名
const STORAGE_KEY = 'serenote_subscription_plan_v1';

const SubscriptionContext =
  createContext<SubscriptionContextValue | null>(null);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // 初期値は free。あとで AsyncStorage から上書き
  const [plan, setPlanState] = useState<SubscriptionPlan>('free');

  // 初回マウント時に保存済みプランを読み込む
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;

        if (saved === 'free' || saved === 'pro') {
          setPlanState(saved);
        }
      } catch (e) {
        console.warn('Failed to load subscription plan', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // plan を変更するときは state + AsyncStorage 両方更新
  const setPlan = (next: SubscriptionPlan) => {
    setPlanState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(e => {
      console.warn('Failed to save subscription plan', e);
    });
  };

  // ⭐ Pro への誘導：今は Alert だけ。あとで課金画面に差し替えればOK
  const openProPaywall = () => {
    Alert.alert(
      'SereNote Pro',
      'SereNote Pro では「行動 × 気分」の詳しい統計を確認できます。\n\n' +
        '・行動時間の合計 / 1日平均\n' +
        '・気分と行動の関連性\n' +
        '・診察に役立つ振り返り\n\n' +
        '※ 課金画面と連携するまでは、このお知らせのみ表示されます。',
      [{ text: 'OK' }]
    );
  };

  const value = useMemo(
    () => ({
      plan,
      isPro: plan === 'pro',
      setPlan,
      openProPaywall,
    }),
    [plan]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error(
      'useSubscription must be used within SubscriptionProvider'
    );
  }
  return ctx;
}