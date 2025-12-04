// app/(tabs)/settings.tsx
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

import { useTheme } from '../../src/theme/useTheme';

export default function SettingsTopScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text
          style={[
            styles.title,
            { color: theme.colors.textMain },
          ]}
        >
          設定
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.colors.textSub },
          ]}
        >
          アカウントやアプリの情報をここから確認・編集できます。
        </Text>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textMain },
            ]}
          >
            項目
          </Text>

          {/* ユーザー設定 */}
          <TouchableOpacity
            style={[
              styles.itemCard,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() => router.push('/settings/user-settings')}
          >
            <View style={styles.itemTextBox}>
              <Text
                style={[
                  styles.itemTitle,
                  { color: theme.colors.textMain },
                ]}
              >
                ユーザー設定
              </Text>
              <Text
                style={[
                  styles.itemSubtitle,
                  { color: theme.colors.textSub },
                ]}
              >
                ニックネームやお薬・リマインド設定を変更できます。
              </Text>
            </View>
            <Text
              style={[
                styles.itemChevron,
                { color: theme.colors.textSub },
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>

          {/* アプリ情報 */}
          <TouchableOpacity
            style={[
              styles.itemCard,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() => router.push('/settings/app-info')}
          >
            <View style={styles.itemTextBox}>
              <Text
                style={[
                  styles.itemTitle,
                  { color: theme.colors.textMain },
                ]}
              >
                アプリ情報（利用規約など）
              </Text>
              <Text
                style={[
                  styles.itemSubtitle,
                  { color: theme.colors.textSub },
                ]}
              >
                利用規約・プライバシーポリシー・データの扱い・通知・使い方など。
              </Text>
            </View>
            <Text
              style={[
                styles.itemChevron,
                { color: theme.colors.textSub },
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { color: theme.colors.textSub },
            ]}
          >
            SereNote ver. 1.0
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  itemTextBox: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  itemChevron: {
    fontSize: 20,
    marginLeft: 8,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
  },
});