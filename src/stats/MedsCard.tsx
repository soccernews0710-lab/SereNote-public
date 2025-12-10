// src/stats/MedsCard.tsx （or app/stats/MedsCard.tsx）

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  calcMedsSummary,
  type StatsRow,
} from '../../src/stats/statsLogic';
import { useTheme } from '../../src/theme/useTheme';

type Props = {
  rows: StatsRow[];
  periodLabel: string;
};

export const MedsCard: React.FC<Props> = ({ rows, periodLabel }) => {
  const { theme } = useTheme();

  const medsSummary = useMemo(() => calcMedsSummary(rows), [rows]);

  const totalDays = rows.length;
  const daysWithMeds = medsSummary.daysWithMeds ?? 0;
  const missedDays =
    totalDays > 0 ? Math.max(totalDays - daysWithMeds, 0) : 0;

  const adherenceText =
    totalDays > 0
      ? `${daysWithMeds} / ${totalDays} 日`
      : '—';

  const missedText =
    totalDays > 0 ? `${missedDays} 日` : '—';

  const avgPerDayText =
    totalDays > 0
      ? `${medsSummary.avgPerDay.toFixed(2)} 回 / 日`
      : '—';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      {/* 見出し */}
      <View style={styles.cardHeader}>
        <Text
          style={[
            styles.cardTitle,
            { color: theme.colors.textMain },
          ]}
        >
          服薬の概要
        </Text>
        <Text
          style={[
            styles.cardPeriodText,
            { color: theme.colors.textSub },
          ]}
        >
          {periodLabel}
        </Text>
      </View>

      {/* 内容エリア（3行のテキスト） */}
      <View style={styles.row}>
        <Text
          style={[
            styles.label,
            { color: theme.colors.textSub },
          ]}
        >
          服薬を記録した日
        </Text>
        <Text
          style={[
            styles.value,
            { color: theme.colors.textMain },
          ]}
        >
          {adherenceText}
        </Text>
      </View>

      <View style={styles.row}>
        <Text
          style={[
            styles.label,
            { color: theme.colors.textSub },
          ]}
        >
          飲み忘れ（記録なし）
        </Text>
        <Text
          style={[
            styles.value,
            { color: theme.colors.textMain },
          ]}
        >
          {missedText}
        </Text>
      </View>

      <View style={[styles.row, { marginTop: 4 }]}>
        <Text
          style={[
            styles.label,
            { color: theme.colors.textSub },
          ]}
        >
          1日あたりの平均回数
        </Text>
        <Text
          style={[
            styles.value,
            { color: theme.colors.textMain },
          ]}
        >
          {avgPerDayText}
        </Text>
      </View>

      {/* 補足テキスト */}
      <Text
        style={[
          styles.note,
          { color: theme.colors.textSub },
        ]}
      >
        ※ 記録がない日は「飲み忘れ / 未記録」としてカウントしています。
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  cardPeriodText: {
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  label: {
    fontSize: 12,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  note: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
  },
});