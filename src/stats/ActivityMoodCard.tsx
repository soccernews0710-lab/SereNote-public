// src/stats/ActivityMoodCard.tsx
import React, { useMemo } from 'react';
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

  // Pro ロック制御用
  locked?: boolean;
  onPressUpgrade?: () => void;
};

// 行動あり / なし で平均気分を比較
function calcActivityMoodSummary(rows: StatsRow[]) {
  const withAct: number[] = [];
  const withoutAct: number[] = [];

  rows.forEach(r => {
    if (r.moodAvg == null) return;
    if (r.activityMinutes > 0) {
      withAct.push(r.moodAvg);
    } else {
      withoutAct.push(r.moodAvg);
    }
  });

  const avg = (arr: number[]) =>
    arr.length === 0
      ? null
      : arr.reduce((s, v) => s + v, 0) / arr.length;

  const avgWith = avg(withAct);
  const avgWithout = avg(withoutAct);

  let diffLabel = 'データが少ないため傾向はまだ分かりません。';
  if (avgWith != null && avgWithout != null) {
    const diff = avgWith - avgWithout;

    if (Math.abs(diff) < 0.25) {
      diffLabel = '行動した日としなかった日で、気分の大きな差は見られません。';
    } else if (diff >= 0.25) {
      diffLabel =
        '行動した日のほうが、気分スコアが少し高い傾向があります。';
    } else {
      diffLabel =
        '行動しなかった日のほうが、気分スコアが少し高い傾向があります。';
    }
  }

  return {
    daysWithAct: withAct.length,
    daysWithoutAct: withoutAct.length,
    avgMoodWithAct: avgWith,
    avgMoodWithoutAct: avgWithout,
    diffLabel,
  };
}

// 小数 1 桁表示用
const formatScore = (v: number | null): string =>
  v == null ? '—' : v.toFixed(1);

export const ActivityMoodCard: React.FC<Props> = ({
  rows,
  periodLabel,
  locked = false,
  onPressUpgrade,
}) => {
  const { theme } = useTheme();

  // 🔒 Pro ロック表示
  if (locked) {
    return (
      <View
        style={[
          styles.card,
          styles.lockedCard,
          {
            backgroundColor: theme.colors.surfaceAlt,
            borderColor: theme.colors.borderSoft,
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
            行動 × 気分（Pro）
          </Text>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        </View>

        <Text
          style={[
            styles.lockedText,
            { color: theme.colors.textSub },
          ]}
        >
          {periodLabel} の
          {'「行動した日」と「行動していない日」'}
          の気分の違いを、自動で比較・コメントしてくれる機能です。
        </Text>

        <TouchableOpacity
          style={[
            styles.upgradeBtn,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={onPressUpgrade}
          activeOpacity={0.8}
        >
          <Text style={styles.upgradeBtnText}>
            Pro で詳しい分析を見る
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 🔓 Pro ユーザー向けの本体
  const summary = useMemo(
    () => calcActivityMoodSummary(rows),
    [rows]
  );

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
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.title,
            { color: theme.colors.textMain },
          ]}
        >
          行動 × 気分（{periodLabel}）
        </Text>
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
      </View>

      <Text
        style={[
          styles.caption,
          { color: theme.colors.textSub },
        ]}
      >
        行動した日と、ほとんど動かなかった日の「平均気分スコア」を比べています。
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statsCol}>
          <Text
            style={[
              styles.label,
              { color: theme.colors.textSub },
            ]}
          >
            行動した日数
          </Text>
          <Text
            style={[
              styles.value,
              { color: theme.colors.textMain },
            ]}
          >
            {summary.daysWithAct} 日
          </Text>
          <Text
            style={[
              styles.smallLabel,
              { color: theme.colors.textSub },
            ]}
          >
            平均気分
          </Text>
          <Text
            style={[
              styles.valueBig,
              { color: theme.colors.accentGreen },
            ]}
          >
            {formatScore(summary.avgMoodWithAct)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsCol}>
          <Text
            style={[
              styles.label,
              { color: theme.colors.textSub },
            ]}
          >
            行動なしの日数
          </Text>
          <Text
            style={[
              styles.value,
              { color: theme.colors.textMain },
            ]}
          >
            {summary.daysWithoutAct} 日
          </Text>
          <Text
            style={[
              styles.smallLabel,
              { color: theme.colors.textSub },
            ]}
          >
            平均気分
          </Text>
          <Text
            style={[
              styles.valueBig,
              { color: theme.colors.accentBlue },
            ]}
          >
            {formatScore(summary.avgMoodWithoutAct)}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.comment,
          { color: theme.colors.textMain },
        ]}
      >
        {summary.diffLabel}
      </Text>

      <Text
        style={[
          styles.helper,
          { color: theme.colors.textSub },
        ]}
      >
        ※ あくまで自分の記録から見た傾向です。
        無理に行動を増やすのではなく、「どのくらい動くと自分は楽か」を知るための
        参考情報として使ってください。
      </Text>
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
    borderWidth: 1,
  },
  lockedCard: {
    borderStyle: 'dashed',
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
  },
  caption: {
    fontSize: 11,
    marginBottom: 8,
  },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#4F46E5',
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  lockedText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 10,
  },
  upgradeBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 4,
  },
  upgradeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 8,
  },
  statsCol: {
    flex: 1,
  },
  divider: {
    width: 1,
    marginHorizontal: 10,
    backgroundColor: '#E5E7EB',
  },
  label: {
    fontSize: 11,
    marginBottom: 2,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
  },
  smallLabel: {
    fontSize: 10,
    marginTop: 6,
  },
  valueBig: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  comment: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  helper: {
    fontSize: 10,
    marginTop: 6,
  },
});