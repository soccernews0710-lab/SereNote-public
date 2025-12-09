// app/stats/OverviewCard.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StatsRow } from '../../src/stats/statsLogic';
import { calcOverviewSummary } from '../../src/stats/statsLogic';
import { useTheme } from '../../src/theme/useTheme';

type Props = {
  rows: StatsRow[];
  periodLabel: string;
};

export const OverviewCard: React.FC<Props> = ({
  rows,
  periodLabel,
}) => {
  const { theme } = useTheme();
  const summary = calcOverviewSummary(rows);

  const recordRatePercent = Math.round(summary.recordRate * 100);

  const moodScoreText =
    summary.avgMoodScore != null
      ? `${summary.avgMoodScore.toFixed(1)} / 5`
      : '—';

  const sleepHoursText =
    summary.avgSleepHours != null
      ? `${summary.avgSleepHours.toFixed(1)} 時間`
      : '—';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.card, shadowColor: '#000' },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: theme.colors.textMain },
        ]}
      >
        {periodLabel} のサマリー
      </Text>

      <View style={styles.row}>
        <Text
          style={[
            styles.label,
            { color: theme.colors.textSub },
          ]}
        >
          記録した日
        </Text>
        <Text
          style={[
            styles.value,
            { color: theme.colors.textMain },
          ]}
        >
          {summary.daysWithAnyRecord}/{summary.totalDays} 日
          <Text style={styles.small}>
            {`  (${recordRatePercent}%)`}
          </Text>
        </Text>
      </View>

      <View style={styles.row}>
        <Text
          style={[
            styles.label,
            { color: theme.colors.textSub },
          ]}
        >
          平均気分
        </Text>
        <Text
          style={[
            styles.value,
            { color: theme.colors.textMain },
          ]}
        >
          {summary.avgMoodLabel}
          <Text style={styles.small}>{`  ${moodScoreText}`}</Text>
        </Text>
      </View>

      <View style={styles.row}>
        <Text
          style={[
            styles.label,
            { color: theme.colors.textSub },
          ]}
        >
          平均睡眠時間
        </Text>
        <Text
          style={[
            styles.value,
            { color: theme.colors.textMain },
          ]}
        >
          {sleepHoursText}
        </Text>
      </View>
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
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
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
  small: {
    fontSize: 11,
    fontWeight: '400',
  },
});