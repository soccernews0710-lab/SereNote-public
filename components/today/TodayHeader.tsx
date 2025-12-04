// components/today/TodayHeader.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../src/theme/useTheme';

type Props = {
  dateLabel: string;
};

export const TodayHeader: React.FC<Props> = ({ dateLabel }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.dateHeader}>
      <Text
        style={[
          styles.dateText,
          { color: theme.colors.textMain },
        ]}
      >
        {dateLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  dateHeader: {
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
});