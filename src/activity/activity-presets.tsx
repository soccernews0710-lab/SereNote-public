// src/activity/activity-presets.tsx
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useTheme } from '../theme/useTheme';
import { ACTIVITY_CATEGORY_META } from '../types/timeline';
import type { ActivityPreset } from './activityPresetStorage';
import { useActivityPresets } from './useActivityPresets';

export type ActivityPresetsBarProps = {
  /** プリセットがタップされたときに呼ばれる */
  onSelectPreset: (preset: ActivityPreset) => void;
};

/**
 * 「よく使う行動」プリセットを横スクロールのチップで表示するバー。
 * ActivityModal などから呼び出して使う想定。
 */
export const ActivityPresetsBar: React.FC<ActivityPresetsBarProps> = ({
  onSelectPreset,
}) => {
  const { theme } = useTheme();
  const { presets, loading } = useActivityPresets();

  // プリセットがまだない / ロード中のときは薄くガイド表示
  if (loading) {
    return (
      <View style={styles.container}>
        <Text
          style={[
            styles.helperText,
            { color: theme.colors.textSub },
          ]}
        >
          プリセットを読み込み中…
        </Text>
      </View>
    );
  }

  if (!loading && presets.length === 0) {
    return (
      <View style={styles.container}>
        <Text
          style={[
            styles.helperText,
            { color: theme.colors.textSub },
          ]}
        >
          よく使う行動を登録しておくと、ここに表示されます。
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          { color: theme.colors.textSub },
        ]}
      >
        よく使う行動
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {presets.map(preset => {
          const meta = ACTIVITY_CATEGORY_META[preset.category];
          const emoji = meta?.emoji ?? '✅';

          return (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.chip,
                {
                  borderColor: theme.colors.borderSoft,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              onPress={() => onSelectPreset(preset)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: theme.colors.textMain },
                ]}
              >
                {emoji} {preset.label}{' '}
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.textSub,
                  }}
                >
                  ({preset.defaultMinutes}分)
                </Text>
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// default export も用意
export default ActivityPresetsBar;

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 11,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
});