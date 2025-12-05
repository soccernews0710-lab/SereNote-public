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

export type SubscriptionPlan = 'free' | 'pro';

type SubscriptionContextValue = {
  plan: SubscriptionPlan;
  isPro: boolean;
  setPlan: (plan: SubscriptionPlan) => void;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

// 他とかぶらないようにそれっぽいキー名
const STORAGE_KEY = 'serenote_subscription_plan_v1';

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

  const value = useMemo(
    () => ({
      plan,
      isPro: plan === 'pro',
      setPlan,
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