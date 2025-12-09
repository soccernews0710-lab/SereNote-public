// app/stats/SleepCard.tsx
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  buildChartPoints,
  calcSleepSummary,
  type StatsRow,
} from '../../src/stats/statsLogic';
import { useTheme } from '../../src/theme/useTheme';
import { LineChart } from './LineChart';

type Props = {
  rows: StatsRow[];
  periodLabel: string;
};

export const SleepCard: React.FC<Props> = ({ rows, periodLabel }) => {
  const { theme } = useTheme();

  const sleepSummary = useMemo(() => calcSleepSummary(rows), [rows]);

  const sleepPoints = useMemo(
    () =>
      buildChartPoints(rows, r =>
        r.sleepMinutes != null ? r.sleepMinutes / 60 : null
      ),
    [rows]
  );

  const sleepYMax =
    sleepPoints.length > 0
      ? Math.max(10, Math.ceil(Math.max(...sleepPoints.map(p => p.value)) + 1))
      : 10;

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
          睡眠パターン
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
        color={theme.colors.accentSleep}
        points={sleepPoints}
        yMin={0}
        yMax={sleepYMax}
        height={150}
        valueFormatter={v => `${v.toFixed(1)} h`}
      />

      <View style={styles.cardBottomRow}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.cardLabel,
              { color: theme.colors.textSub },
            ]}
          >
            平均睡眠時間
          </Text>
          <Text
            style={[
              styles.cardValue,
              { color: theme.colors.textMain },
            ]}
          >
            {sleepSummary.avgHours != null
              ? `${sleepSummary.avgHours.toFixed(1)} h`
              : '—'}
          </Text>
          <Text
            style={[
              styles.cardSub,
              { color: theme.colors.textSub },
            ]}
          >
            睡眠データのある日: {sleepSummary.daysWithData} 日
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.cardLabel,
              { color: theme.colors.textSub },
            ]}
          >
            睡眠のボリューム感
          </Text>
          <Text
            style={[
              styles.cardValue,
              { color: theme.colors.textMain },
            ]}
          >
            {sleepSummary.volumeTag}
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
  cardSub: {
    fontSize: 11,
    marginTop: 2,
  },
});