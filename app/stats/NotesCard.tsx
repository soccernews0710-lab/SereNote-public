// app/stats/NotesCard.tsx
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../src/theme/useTheme';
import { LineChart } from './LineChart';
import {
    buildChartPoints,
    calcNotesSummary,
    type StatsRow,
} from './statsLogic';

type Props = {
  rows: StatsRow[];
  periodLabel: string;
};

export const NotesCard: React.FC<Props> = ({ rows, periodLabel }) => {
  const { theme } = useTheme();

  const notesSummary = useMemo(() => calcNotesSummary(rows), [rows]);

  const notesPoints = useMemo(
    () =>
      buildChartPoints(rows, r => {
        const total = r.notesCount + r.symptomsCount;
        return total > 0 ? total : null;
      }),
    [rows]
  );

  const notesYMax =
    notesPoints.length > 0
      ? Math.max(4, Math.max(...notesPoints.map(p => p.value)))
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
          メモ / 症状の記録
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
        color={theme.colors.accentNotes}
        points={notesPoints}
        yMin={0}
        yMax={notesYMax}
        height={140}
        valueFormatter={v => `${v.toFixed(1)} 件`}
      />

      <View style={styles.cardBottomRow}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.cardLabel,
              { color: theme.colors.textSub },
            ]}
          >
            平均件数 / 日
          </Text>
          <Text
            style={[
              styles.cardValue,
              { color: theme.colors.textMain },
            ]}
          >
            {notesSummary.avgPerDay.toFixed(2)} 件
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.cardLabel,
              { color: theme.colors.textSub },
            ]}
          >
            書いた日数
          </Text>
          <Text
            style={[
              styles.cardValue,
              { color: theme.colors.textMain },
            ]}
          >
            {notesSummary.daysWithAny} 日
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