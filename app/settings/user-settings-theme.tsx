// app/settings/user-settings-theme.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { themes, type ThemeName } from '../../src/theme/theme';
import { useTheme } from '../../src/theme/useTheme';

const THEME_ORDER: ThemeName[] = [
  'serenote',
  'calmGreen',
  'sunnyYellow',
  'nightBlue',
];

const LABELS: Record<ThemeName, string> = {
  serenote: 'Serenote',
  calmGreen: 'Calm Green',
  sunnyYellow: 'Sunrise',
  nightBlue: 'Night',
};

export default function ThemeSettingsScreen() {
  const router = useRouter();
  const { theme, themeName, setThemeName } = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* ヘッダー */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text
              style={[
                styles.backText,
                { color: theme.colors.primary },
              ]}
            >
              ‹ 戻る
            </Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.colors.textMain },
            ]}
          >
            テーマカラー
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <Text
          style={[
            styles.description,
            { color: theme.colors.textSub },
          ]}
        >
          アプリ全体の色を選択できます。
          すぐに全画面へ反映されます。
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <View style={styles.themeRow}>
            {THEME_ORDER.map(name => {
              const t = themes[name];
              const active = themeName === name;
              const label = LABELS[name];

              return (
                <TouchableOpacity
                  key={name}
                  onPress={() => setThemeName(name)}
                  style={[
                    styles.themeChip,
                    {
                      borderColor: active
                        ? t.colors.primary
                        : theme.colors.borderSoft,
                      backgroundColor: active
                        ? t.colors.primarySoft
                        : theme.colors.surfaceAlt,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.themeDot,
                      { backgroundColor: t.colors.primary },
                    ]}
                  />
                  <Text
                    style={[
                      styles.themeChipText,
                      { color: theme.colors.textMain },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    fontSize: 13,
    width: 48,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  themeRow: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  themeChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  themeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
});