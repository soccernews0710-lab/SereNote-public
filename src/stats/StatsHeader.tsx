// src/stats/StatsHeader.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import type { StatsPeriod } from './statsLogic';

type Props = {
  period: StatsPeriod;
  onChangePeriod: (p: StatsPeriod) => void;

  // 🆕 Free / Pro 切り分け用
  isPro: boolean;
  onPressUpgrade: () => void;
};

export const StatsHeader: React.FC<Props> = ({
  period,
  onChangePeriod,
  isPro,
  onPressUpgrade,
}) => {
  const { theme } = useTheme();

  const renderChip = (
    label: string,
    value: StatsPeriod,
    locked: boolean
  ) => {
    const active = period === value;

    const handlePress = () => {
      if (locked && !isPro) {
        onPressUpgrade();
        return;
      }
      onChangePeriod(value);
    };

    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.chip,
          {
            backgroundColor: active
              ? theme.colors.primary
              : theme.colors.surfaceAlt,
            borderColor: active
              ? 'transparent'
              : theme.colors.borderSoft,
            opacity: locked && !isPro ? 0.6 : 1,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.chipText,
            {
              color: active ? '#FFFFFF' : theme.colors.textSub,
            },
          ]}
        >
          {label}
          {locked && !isPro ? ' 🔒' : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.headerRow}>
      <View>
        <Text style={styles.title}>Stats</Text>
        <Text style={styles.subtitle}>気分・睡眠・服薬の傾向</Text>
      </View>
      <View style={styles.chipsRow}>
        {renderChip('7日', '7d', false)}
        {renderChip('30日', '30d', true)}
        {renderChip('90日', '90d', true)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
});