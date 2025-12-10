// hooks/useSubscriptionPlan.ts
import { useSubscription } from '../src/subscription/useSubscription';

/**
 * 画面側から使いやすいようにしたラッパーフック。
 * いまは useSubscription をそのまま返しているだけだけど、
 * 将来「お試し期間」や「キャンペーン」などをはさむならここで吸収できる。
 */
export function useSubscriptionPlan() {
  const { plan, isPro, setPlan, openProPaywall } = useSubscription();

  return {
    plan,
    isPro,
    setPlan,
    openProPaywall,
  };
}