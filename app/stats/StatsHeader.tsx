// app/stats/StatsHeader.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../src/theme/useTheme';
import type { StatsPeriod } from './statsLogic';

type Props = {
  period: StatsPeriod;
  onChangePeriod: (p: StatsPeriod) => void;
};

export const StatsHeader: React.FC<Props> = ({ period, onChangePeriod }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.headerRow}>
      <View>
        <Text
          style={[
            styles.screenTitle,
            { color: theme.colors.textMain },
          ]}
        >
          Stats
        </Text>
        <Text
          style={[
            styles.screenSubtitle,
            { color: theme.colors.textSub },
          ]}
        >
          最近の自分のパターンを見返してみましょう
        </Text>
      </View>

      <View
        style={[
          styles.periodSwitcher,
          { backgroundColor: theme.colors.surfaceAlt },
        ]}
      >
        {(['7d', '30d', '90d'] as StatsPeriod[]).map(p => {
          const active = period === p;
          const label = p === '7d' ? '7日' : p === '30d' ? '30日' : '90日';
          return (
            <TouchableOpacity
              key={p}
              onPress={() => onChangePeriod(p)}
              style={[
                styles.periodChip,
                active && {
                  backgroundColor: theme.colors.textMain,
                },
              ]}
            >
              <Text
                style={[
                  styles.periodChipText,
                  active
                    ? { color: theme.colors.background }
                    : { color: theme.colors.textSub },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  screenSubtitle: {
    marginTop: 2,
    fontSize: 13,
  },
  periodSwitcher: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    borderRadius: 999,
  },
  periodChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  periodChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
});