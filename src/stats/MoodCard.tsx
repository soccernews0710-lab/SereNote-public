// app/stats/MoodCard.tsx
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  buildChartPoints,
  calcMoodSummary,
  type StatsRow,
} from '../../src/stats/statsLogic';
import { useTheme } from '../../src/theme/useTheme';
import { LineChart } from './LineChart';

type Props = {
  rows: StatsRow[];
  periodLabel: string;
};

export const MoodCard: React.FC<Props> = ({ rows, periodLabel }) => {
  const { theme } = useTheme();

  const moodSummary = useMemo(() => calcMoodSummary(rows), [rows]);
  const moodPoints = useMemo(
    () => buildChartPoints(rows, r => r.moodAvg),
    [rows]
  );

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
          気分の傾向
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
        color={theme.colors.accentMood}
        points={moodPoints}
        yMin={1}
        yMax={5}
        height={150}
        valueFormatter={v => `${v.toFixed(2)} / 5`}
      />

      <View style={styles.cardBottomRow}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.cardLabel,
              { color: theme.colors.textSub },
            ]}
          >
            平均スコア
          </Text>
          <Text
            style={[
              styles.cardValue,
              { color: theme.colors.textMain },
            ]}
          >
            {moodSummary.avgScore != null
              ? moodSummary.avgScore.toFixed(2)
              : '—'}
          </Text>
          <Text
            style={[
              styles.cardSub,
              { color: theme.colors.textSub },
            ]}
          >
            {moodSummary.avgLabel}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.cardLabel,
              { color: theme.colors.textSub },
            ]}
          >
            気分の安定度
          </Text>
          <Text
            style={[
              styles.cardValue,
              {
                fontSize: 15,
                lineHeight: 20,
                color: theme.colors.textMain,
              },
            ]}
          >
            {moodSummary.stabilityLabel}
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

export default MoodCard;