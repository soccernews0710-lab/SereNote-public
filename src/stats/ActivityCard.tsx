// src/stats/ActivityCard.tsx
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
import type { StatsRow } from './statsLogic';

// 👑 ActivityMoodCard と同じ雰囲気の Pro バッジ
const ProBadge: React.FC = () => (
  <View style={styles.proBadge}>
    <Text style={styles.proBadgeText}>👑 Pro</Text>
  </View>
);

type Props = {
  rows: StatsRow[];
  periodLabel: string;
};

export const ActivityCard: React.FC<Props> = ({
  rows,
  periodLabel,
}) => {
  const { theme } = useTheme();
  const { isPro } = useSubscription();
  const router = useRouter();

  // ─────────────────────────
  // 行動時間の集計
  // ─────────────────────────
  const { totalMinutes, daysWithAny, avgPerDay } = useMemo(() => {
    const total = rows.reduce(
      (acc, r) => acc + (r.activityMinutes || 0),
      0
    );
    const days = rows.filter(r => (r.activityMinutes || 0) > 0).length;
    const avg = days > 0 ? total / days : 0;

    return {
      totalMinutes: total,
      daysWithAny: days,
      avgPerDay: avg,
    };
  }, [rows]);

  const formatMinutes = (minutes: number): string => {
    if (minutes <= 0) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} 分`;
    if (m === 0) return `${h} 時間`;
    return `${h} 時間 ${m} 分`;
  };

  const totalText = formatMinutes(totalMinutes);
  const avgText =
    avgPerDay > 0 ? formatMinutes(Math.round(avgPerDay)) : '—';

  // ─────────────────────────
  // Free ユーザー用ロック UI
  // ─────────────────────────
  if (!isPro) {
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
            行動時間のくわしい関係
          </Text>
          <ProBadge />
        </View>

        <Text
          style={[
            styles.lockSummary,
            { color: theme.colors.textSub },
          ]}
        >
          {periodLabel} の「行動時間」をまとめて振り返るための Pro 機能です。
        </Text>

        <View style={styles.lockBox}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>このカードは Pro 機能です</Text>
          <Text style={styles.lockDesc}>
            ・期間中の合計行動時間{'\n'}
            ・行動を記録した日数{'\n'}
            ・1日あたりの平均行動時間
            {'\n\n'}
            などが自動でまとまります。
          </Text>

          <TouchableOpacity
            style={[
              styles.lockButton,
              { backgroundColor: theme.colors.primary }, // ← ここでテーマカラーを適用
            ]}
            onPress={() =>
              router.push('/settings/user-settings-subscription')
            }
            activeOpacity={0.9}
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
  // Pro ユーザー用：実データ表示
  // ─────────────────────────
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
          {periodLabel} の行動時間
        </Text>
        <ProBadge />
      </View>

      <View style={styles.row}>
        <Text
          style={[
            styles.label,
            { color: theme.colors.textSub },
          ]}
        >
          合計
        </Text>
        <Text
          style={[
            styles.value,
            { color: theme.colors.textMain },
          ]}
        >
          {totalText}
        </Text>
      </View>

      <View style={styles.row}>
        <Text
          style={[
            styles.label,
            { color: theme.colors.textSub },
          ]}
        >
          行動を記録した日数
        </Text>
        <Text
          style={[
            styles.value,
            { color: theme.colors.textMain },
          ]}
        >
          {daysWithAny}/{rows.length} 日
        </Text>
      </View>

      <View style={styles.row}>
        <Text
          style={[
            styles.label,
            { color: theme.colors.textSub },
          ]}
        >
          1日あたり（記録がある日）
        </Text>
        <Text
          style={[
            styles.value,
            { color: theme.colors.textMain },
          ]}
        >
          {avgText}
        </Text>
      </View>

      <Text
        style={[
          styles.helper,
          { color: theme.colors.textSub },
        ]}
      >
        ※ その日の行動で「開始時間」と「終了時間」を入れると、
        ここに自動で反映されます。
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  // 👑 Pro バッジ（ActivityMoodCard と揃える）
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
  // Pro 表示用
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 4,
  },
  label: {
    fontSize: 12,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
  },
  helper: {
    marginTop: 6,
    fontSize: 11,
  },
  // Free ロック UI（ActivityMoodCard に揃えた感じ）
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
  },
  lockButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default ActivityCard;