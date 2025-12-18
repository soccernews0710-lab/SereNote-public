// components/timeline/FloatingActionButton.tsx
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { SerenoteTheme } from '../../src/theme/theme';

type Props = {
  theme: SerenoteTheme;
  onPress: () => void;
  disabled?: boolean;
};

function FloatingActionButton({ theme, onPress, disabled }: Props) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        style={[
          styles.fab,
          {
            backgroundColor: disabled ? theme.colors.surfaceAlt : theme.colors.primary,
            opacity: disabled ? 0.7 : 1,
          },
        ]}
      >
        <Text style={styles.plus}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

export default memo(FloatingActionButton);

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 16,
    bottom: 18,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  plus: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 30,
    marginTop: -1,
  },
});