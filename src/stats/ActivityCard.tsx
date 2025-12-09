// src/stats/ActivityCard.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import type { StatsRow } from './statsLogic';

type Props = {
  rows: StatsRow[];
  periodLabel: string;

  /** true のとき Pro ロック表示にする（無料版） */
  locked?: boolean;
  /** 「Pro をチェック」ボタンで呼ぶコールバック */
  onPressUpgrade?: () => void;
};

export const ActivityCard: React.FC<Props> = ({
  rows,
  periodLabel,
  locked = false,
  onPressUpgrade,
}) => {
  const { theme } = useTheme();

  // ▼ 行動時間の集計（ロック状態でも内部では計算してOK）
  const totalMinutes = rows.reduce(
    (acc, r) => acc + (r.activityMinutes || 0),
    0
  );

  const daysWithAny = rows.filter(
    r => (r.activityMinutes || 0) > 0
  ).length;

  const avgPerDay =
    daysWithAny > 0 ? totalMinutes / daysWithAny : 0;

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

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          shadowColor: '#000',
        },
      ]}
    >
      {/* ヘッダー行：タイトル + PRO バッジ */}
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.title,
            { color: theme.colors.textMain },
          ]}
        >
          {periodLabel} の行動時間
        </Text>

        {/* PRO バッジ */}
        <View
          style={[
            styles.proBadge,
            locked
              ? styles.proBadgeLocked
              : styles.proBadgeActive,
          ]}
        >
          <Text
            style={[
              styles.proBadgeText,
              locked
                ? styles.proBadgeTextLocked
                : styles.proBadgeTextActive,
            ]}
          >
            PRO
          </Text>
        </View>
      </View>

      {/* ▼ ロックされている場合：説明 + アップグレードボタン */}
      {locked ? (
        <>
          <Text
            style={[
              styles.lockDescription,
              { color: theme.colors.textSub },
            ]}
          >
            行動を記録すると、「合計時間」や「1日あたりの時間」を
            SereNote Pro で確認できます。
          </Text>
          <Text
            style={[
              styles.lockDescription,
              {
                color: theme.colors.textSub,
                marginTop: 4,
              },
            ]}
          >
            気分のグラフと合わせて見ることで、
            「どんな行動の日に気分が安定しやすいか」などを振り返れます。
          </Text>

          <TouchableOpacity
            style={[
              styles.upgradeButton,
              { borderColor: theme.colors.primary },
            ]}
            onPress={onPressUpgrade}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.upgradeButtonText,
                { color: theme.colors.primary },
              ]}
            >
              SereNote Pro で詳しく見る
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        // ▼ Pro ユーザーの場合：実データ表示
        <>
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
    marginBottom: 8,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  proBadgeActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  proBadgeLocked: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  proBadgeTextActive: {
    color: '#4F46E5',
  },
  proBadgeTextLocked: {
    color: '#6B7280',
  },
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
  lockDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  upgradeButton: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});