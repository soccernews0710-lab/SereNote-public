// components/today/TodaySummaryCard.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../src/theme/useTheme';

export type TodaySummary = {
  sleep: string;
  meds: string;
  mood: string;
  activities: string;
};

type Props = {
  summary: TodaySummary;
};

export const TodaySummaryCard: React.FC<Props> = ({ summary }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.summaryCard,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <Text
        style={[
          styles.summaryTitle,
          { color: theme.colors.textMain },
        ]}
      >
        今日のまとめ
      </Text>

      <View style={styles.summaryRow}>
        <Text
          style={[
            styles.summaryLabel,
            { color: theme.colors.textMain },
          ]}
        >
          😴 睡眠
        </Text>
        <Text
          style={[
            styles.summaryValue,
            { color: theme.colors.textSub },
          ]}
        >
          {summary.sleep}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <Text
          style={[
            styles.summaryLabel,
            { color: theme.colors.textMain },
          ]}
        >
          💊 服薬
        </Text>
        <Text
          style={[
            styles.summaryValue,
            { color: theme.colors.textSub },
          ]}
        >
          {summary.meds}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <Text
          style={[
            styles.summaryLabel,
            { color: theme.colors.textMain },
          ]}
        >
          🙂 気分
        </Text>
        <Text
          style={[
            styles.summaryValue,
            { color: theme.colors.textSub },
          ]}
        >
          {summary.mood}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <Text
          style={[
            styles.summaryLabel,
            { color: theme.colors.textMain },
          ]}
        >
          🏃 行動
        </Text>
        <Text
          style={[
            styles.summaryValue,
            { color: theme.colors.textSub },
          ]}
        >
          {summary.activities}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  summaryLabel: {
    width: 70,
    fontSize: 13,
    fontWeight: '500',
  },
  summaryValue: {
    flex: 1,
    fontSize: 13,
  },
});