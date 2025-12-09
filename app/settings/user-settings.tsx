// app/settings/user-settings.tsx
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

export default function UserSettingsMenuScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* タイトル */}
        <Text
          style={[
            styles.title,
            { color: theme.colors.textMain },
          ]}
        >
          ユーザー設定
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.colors.textSub },
          ]}
        >
          テーマカラーやニックネーム、お薬設定、データの出力などを
          ここから設定できます。
        </Text>

        {/* メニュー一覧 */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textMain },
            ]}
          >
            項目
          </Text>

          {/* サブスクリプション / SereNote Pro */}
          <TouchableOpacity
            style={[
              styles.itemCard,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() =>
              router.push('/settings/user-settings-subscription')
            }
          >
            <View style={styles.itemTextBox}>
              <Text
                style={[
                  styles.itemTitle,
                  { color: theme.colors.textMain },
                ]}
              >
                サブスクリプション（SereNote Pro）
              </Text>
              <Text
                style={[
                  styles.itemSubtitle,
                  { color: theme.colors.textSub },
                ]}
              >
                現在のプラン確認・Proへの切り替え（将来的に課金画面と連動）を行います。
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

          {/* プライバシーロック */}
          <TouchableOpacity
            style={[
              styles.itemCard,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() =>
              router.push('/settings/user-settings-privacy-lock')
            }
          >
            <View style={styles.itemTextBox}>
              <Text
                style={[
                  styles.itemTitle,
                  { color: theme.colors.textMain },
                ]}
              >
                プライバシーロック
              </Text>
              <Text
                style={[
                  styles.itemSubtitle,
                  { color: theme.colors.textSub },
                ]}
              >
                FaceID / PIN でアプリを保護します。
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

          {/* テーマカラー */}
          <TouchableOpacity
            style={[
              styles.itemCard,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() =>
              router.push('/settings/user-settings-theme')
            }
          >
            <View style={styles.itemTextBox}>
              <Text
                style={[
                  styles.itemTitle,
                  { color: theme.colors.textMain },
                ]}
              >
                テーマカラー
              </Text>
              <Text
                style={[
                  styles.itemSubtitle,
                  { color: theme.colors.textSub },
                ]}
              >
                アプリ全体の色を選択できます。
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

          {/* ニックネーム */}
          <TouchableOpacity
            style={[
              styles.itemCard,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() =>
              router.push('/settings/user-settings-nickname')
            }
          >
            <View style={styles.itemTextBox}>
              <Text
                style={[
                  styles.itemTitle,
                  { color: theme.colors.textMain },
                ]}
              >
                ニックネーム
              </Text>
              <Text
                style={[
                  styles.itemSubtitle,
                  { color: theme.colors.textSub },
                ]}
              >
                SereNote 内での表示名を変更できます。
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

          {/* 通知設定（プレースホルダー） */}
          <TouchableOpacity
            style={[
              styles.itemCard,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() =>
              router.push('/settings/user-settings-notifications')
            }
          >
            <View style={styles.itemTextBox}>
              <Text
                style={[
                  styles.itemTitle,
                  { color: theme.colors.textMain },
                ]}
              >
                通知設定
              </Text>
              <Text
                style={[
                  styles.itemSubtitle,
                  { color: theme.colors.textSub },
                ]}
              >
                お薬などのリマインド通知を設定する画面（将来追加予定）。
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

          {/* お薬の設定 */}
          <TouchableOpacity
            style={[
              styles.itemCard,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() =>
              router.push('/settings/user-settings-medications')
            }
          >
            <View style={styles.itemTextBox}>
              <Text
                style={[
                  styles.itemTitle,
                  { color: theme.colors.textMain },
                ]}
              >
                お薬の設定
              </Text>
              <Text
                style={[
                  styles.itemSubtitle,
                  { color: theme.colors.textSub },
                ]}
              >
                リマインド時刻や、お薬一覧の登録・編集ができます。
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

          {/* 🆕 行動プリセット */}
          <TouchableOpacity
            style={[
              styles.itemCard,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() =>
              router.push('/settings/user-settings-activity-presets')
            }
          >
            <View style={styles.itemTextBox}>
              <Text
                style={[
                  styles.itemTitle,
                  { color: theme.colors.textMain },
                ]}
              >
                行動プリセット
              </Text>
              <Text
                style={[
                  styles.itemSubtitle,
                  { color: theme.colors.textSub },
                ]}
              >
                「ごはん30分」「散歩20分」など、よく使う行動のプリセットを編集します。
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

          {/* データの出力 */}
          <TouchableOpacity
            style={[
              styles.itemCard,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() =>
              router.push('/settings/user-settings-data-export')
            }
          >
            <View style={styles.itemTextBox}>
              <Text
                style={[
                  styles.itemTitle,
                  { color: theme.colors.textMain },
                ]}
              >
                データの出力（バックアップ用）
              </Text>
              <Text
                style={[
                  styles.itemSubtitle,
                  { color: theme.colors.textSub },
                ]}
              >
                端末内に保存されている記録データを JSON として
                エクスポートする土台機能です。
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
    fontSize: 18,
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
});