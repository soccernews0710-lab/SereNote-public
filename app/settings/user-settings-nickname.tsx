// app/settings/user-settings-nickname.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUserSettings } from '../../hooks/useUserSettings';
import { useTheme } from '../../src/theme/useTheme';

export default function NicknameSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { loaded, nickname, updateNickname } = useUserSettings();

  if (!loaded) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
            ニックネーム
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <Text
          style={[
            styles.description,
            { color: theme.colors.textSub },
          ]}
        >
          SereNote 内で表示される名前です。
          将来的に Today や Stats の画面にも表示される予定です。
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text
            style={[
              styles.label,
              { color: theme.colors.textMain },
            ]}
          >
            表示名
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.colors.borderSoft,
                backgroundColor: theme.colors.surfaceAlt,
                color: theme.colors.textMain,
              },
            ]}
            placeholder="例：まさたか"
            placeholderTextColor={theme.colors.textSub}
            value={nickname ?? ''}
            onChangeText={text => updateNickname(text)}
          />
          <Text
            style={[
              styles.note,
              { color: theme.colors.textSub },
            ]}
          >
            入力内容は自動的に保存されます。
          </Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  note: {
    marginTop: 8,
    fontSize: 11,
  },
});