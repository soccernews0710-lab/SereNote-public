// src/stats/ActivityMoodCard.tsx
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSubscription } from '../subscription/useSubscription';
import { useTheme } from '../theme/useTheme';
import { moodAverageToLabel } from '../utils/mood';
import type { StatsRow } from './statsLogic';

// 小さな Pro バッジ（他のカードでも使い回せる）
const ProBadge: React.FC = () => (
  <View style={styles.proBadge}>
    <Text style={styles.proBadgeText}>👑 Pro</Text>
  </View>
);

type Props = {
  rows: StatsRow[];
  periodLabel: string;
};

export const ActivityMoodCard: React.FC<Props> = ({
  rows,
  periodLabel,
}) => {
  const { theme } = useTheme();
  const { isPro } = useSubscription();
  const router = useRouter();

  // ─────────────────────────
  // データ集計（活動×気分）
  // ─────────────────────────
  const analysis = useMemo(() => {
    // 行動が記録されていて、かつ気分スコアがある日だけ対象
    const valid = rows.filter(
      (r) => r.activityMinutes > 0 && r.moodAvg != null
    );

    if (valid.length < 3) {
      return {
        hasEnough: false,
        count: valid.length,
        highAvg: null as number | null,
        lowAvg: null as number | null,
        diff: null as number | null,
      };
    }

    // ここでは仮に「60分以上=活動多い日」と定義
    const HIGH_THRESHOLD = 60;

    const highDays = valid.filter(
      (r) => r.activityMinutes >= HIGH_THRESHOLD
    );
    const lowDays = valid.filter(
      (r) => r.activityMinutes < HIGH_THRESHOLD
    );

    const avg = (xs: number[]) =>
      xs.length === 0
        ? null
        : xs.reduce((a, b) => a + b, 0) / xs.length;

    // ⚠️ r.moodAvg は 1〜5 想定（statsLogic 側で normalizeMoodValue 済み）
    const highAvg = avg(
      highDays
        .map((r) => r.moodAvg)
        .filter((v): v is number => v != null)
    );
    const lowAvg = avg(
      lowDays
        .map((r) => r.moodAvg)
        .filter((v): v is number => v != null)
    );

    let diff: number | null = null;
    if (highAvg != null && lowAvg != null) {
      diff = highAvg - lowAvg;
    }

    return {
      hasEnough: true,
      count: valid.length,
      highAvg,
      lowAvg,
      diff,
    };
  }, [rows]);

  const formatMoodNumeric = (score: number | null) => {
    if (score == null) return '—';
    return score.toFixed(1);
  };

  const formatMoodLabel = (score: number | null) => {
    if (score == null) return '—';
    // 🧠 ここで moodAverageToLabel を使う：1〜5 の平均値 → ラベル
    return moodAverageToLabel(score);
  };

  // ─────────────────────────
  // Freeユーザー用のロックUI
  // ─────────────────────────
  if (!isPro) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            shadowColor: '#000',
            opacity: 0.9,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.title,
              { color: theme.colors.textMain },
            ]}
          >
            行動 × 気分の傾向
          </Text>
          <ProBadge />
        </View>

        <Text
          style={[
            styles.lockSummary,
            { color: theme.colors.textSub },
          ]}
        >
          {periodLabel} の「行動時間」と「気分スコア」の関係を分析して、
          自分らしく過ごせた日のパターンを見つけるための Pro 機能です。
        </Text>

        <View style={styles.lockBox}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>このカードは Pro 機能です</Text>
          <Text style={styles.lockDesc}>
            ・行動が多い日の平均気分{'\n'}
            ・ゆっくり過ごした日の平均気分{'\n'}
            ・その差（どんな日が「楽」だったか）
            {'\n\n'}
            などが自動でまとまります。
          </Text>

          <TouchableOpacity
            style={styles.lockButton}
            onPress={() =>
              router.push('/settings/user-settings-subscription')
            }
          >
            <Text style={styles.lockButtonText}>
              SereNote Pro について見る
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─────────────────────────
  // Proユーザー用の表示
  // ─────────────────────────
  const { hasEnough, count, highAvg, lowAvg, diff } = analysis;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.card, shadowColor: '#000' },
      ]}
    >
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.title,
            { color: theme.colors.textMain },
          ]}
        >
          行動 × 気分の傾向
        </Text>
        <ProBadge />
      </View>

      <Text
        style={[
          styles.subtitle,
          { color: theme.colors.textSub },
        ]}
      >
        {periodLabel} に記録された「行動時間」と「気分」から、
        あなたに合う過ごし方のヒントをまとめました。
      </Text>

      {!hasEnough ? (
        <Text
          style={[
            styles.helperText,
            { color: theme.colors.textSub },
          ]}
        >
          まだ十分なデータがありません。行動と気分の記録が
          もう少し貯まると傾向が表示されます（いま {count} 日分）。
        </Text>
      ) : (
        <>
          <View style={styles.row}>
            <View style={styles.statBox}>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSub },
                ]}
              >
                行動が多い日
                {'\n'}
                （60分以上）
              </Text>
              <Text
                style={[
                  styles.statValue,
                  { color: theme.colors.textMain },
                ]}
              >
                {formatMoodNumeric(highAvg)}
              </Text>
              <Text
                style={[
                  styles.statValueLabel,
                  { color: theme.colors.textSub },
                ]}
              >
                {formatMoodLabel(highAvg)}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSub },
                ]}
              >
                行動が少ない日
                {'\n'}
                （60分未満）
              </Text>
              <Text
                style={[
                  styles.statValue,
                  { color: theme.colors.textMain },
                ]}
              >
                {formatMoodNumeric(lowAvg)}
              </Text>
              <Text
                style={[
                  styles.statValueLabel,
                  { color: theme.colors.textSub },
                ]}
              >
                {formatMoodLabel(lowAvg)}
              </Text>
            </View>
          </View>

          <View style={styles.resultBox}>
            {diff != null ? (
              <>
                {diff > 0.2 && (
                  <Text style={styles.resultLine}>
                    ✅ 行動が多い日のほうが、平均して気分が少し良さそうです。
                  </Text>
                )}
                {diff < -0.2 && (
                  <Text style={styles.resultLine}>
                    🌿 ゆっくり過ごした日のほうが、平均して気分が落ち着いていそうです。
                  </Text>
                )}
                {Math.abs(diff) <= 0.2 && (
                  <Text style={styles.resultLine}>
                    ⚖️ 行動の多さと気分の差はあまり大きくなさそうです。
                    「どんな予定か」のほうが影響しているかもしれません。
                  </Text>
                )}
                <Text style={styles.resultSub}>
                  （差分: {diff.toFixed(2)} ポイント / {count} 日分のデータ）
                </Text>
              </>
            ) : (
              <Text style={styles.resultLine}>
                データはありますが、行動が多い日・少ない日の両方が揃っていないため、
                差分はまだ出せません。
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  // Proバッジ
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  // Free ロックUI
  lockSummary: {
    fontSize: 12,
    marginBottom: 8,
  },
  lockBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
    backgroundColor: '#F9FAFB',
  },
  lockIcon: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 4,
  },
  lockTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  lockDesc: {
    fontSize: 11,
    color: '#4B5563',
    marginBottom: 8,
  },
  lockButton: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#4F46E5',
  },
  lockButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  // Pro 表示用
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 4,
  },
  statBox: {
    flex: 1,
    marginRight: 6,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statValueLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  resultBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4FF',
  },
  resultLine: {
    fontSize: 12,
    marginBottom: 4,
    color: '#111827',
  },
  resultSub: {
    fontSize: 11,
    color: '#4B5563',
  },
});

export default ActivityMoodCard;