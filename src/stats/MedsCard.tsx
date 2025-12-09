// app/stats/MedsCard.tsx
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  buildChartPoints,
  calcMedsSummary,
  type StatsRow,
} from '../../src/stats/statsLogic';
import { useTheme } from '../../src/theme/useTheme';
import { LineChart } from './LineChart';

type Props = {
  rows: StatsRow[];
  periodLabel: string;
};

export const MedsCard: React.FC<Props> = ({ rows, periodLabel }) => {
  const { theme } = useTheme();

  const medsSummary = useMemo(() => calcMedsSummary(rows), [rows]);

  const medsPoints = useMemo(
    () => buildChartPoints(rows, r => (r.medsCount > 0 ? r.medsCount : null)),
    [rows]
  );

  const medsYMax =
    medsPoints.length > 0
      ? Math.max(4, Math.max(...medsPoints.map(p => p.value)))
      : 4;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text
          style={[
            styles.cardTitle,
            { color: theme.colors.textMain },
          ]}
        >
          服薬の記録
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

      <LineChart
        color={theme.colors.accentMeds}
        points={medsPoints}
        yMin={0}
        yMax={medsYMax}
        height={140}
        valueFormatter={v => `${v.toFixed(1)} 回`}
      />

      <View style={styles.cardBottomRow}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.cardLabel,
              { color: theme.colors.textSub },
            ]}
          >
            平均回数 / 日
          </Text>
          <Text
            style={[
              styles.cardValue,
              { color: theme.colors.textMain },
            ]}
          >
            {medsSummary.avgPerDay.toFixed(2)} 回
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.cardLabel,
              { color: theme.colors.textSub },
            ]}
          >
            服薬を記録した日
          </Text>
          <Text
            style={[
              styles.cardValue,
              { color: theme.colors.textMain },
            ]}
          >
            {medsSummary.daysWithMeds} 日
          </Text>
        </View>
      </View>
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
  cardBottomRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  cardLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});