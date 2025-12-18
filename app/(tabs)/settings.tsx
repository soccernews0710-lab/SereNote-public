// app/(tabs)/settings.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSubscription } from '../../src/subscription/useSubscription';
import { useTheme } from '../../src/theme/useTheme';

// 🆕 バッジ関連
import { BADGE_DEFINITIONS } from '../../src/badges/badgeDefinitions';
import {
  calculateAllBadgeProgress,
  calculateBadgeStats,
  getBreathingCount,
  loadAchievedBadges,
} from '../../src/badges/badgeLogic';
import { loadAllEntries } from '../../src/storage/serenoteStorage';

export default function SettingsTopScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { isPro } = useSubscription();

  // 🆕 バッジ達成数
  const [achievedBadgeCount, setAchievedBadgeCount] = useState(0);
  const totalBadgeCount = BADGE_DEFINITIONS.length;

  // 🆕 バッジ達成数を取得
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [entries, achievedBadges, breathingCount] = await Promise.all([
          loadAllEntries(),
          loadAchievedBadges(),
          getBreathingCount(),
        ]);

        if (cancelled) return;

        const allEntries = entries ?? {};
        const stats = calculateBadgeStats(allEntries, breathingCount);
        const progress = calculateAllBadgeProgress(stats, achievedBadges);
        const achieved = progress.filter(p => p.isAchieved).length;

        setAchievedBadgeCount(achieved);
      } catch (e) {
        console.warn('Failed to load badge count', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentPlanLabel = isPro ? 'SereNote Pro' : 'Free（無料プラン）';
  const currentPlanDesc = isPro
    ? 'Pro 機能（プライバシーロック・高度な統計 など）が利用できます。'
    : '基本的な記録機能を無料で使えます。Pro にすると、より詳しい統計やプライバシーロックが解放されます。';

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

        {/* ===== サブスクリプション（概要 + 遷移） ===== */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textMain },
            ]}
          >
            サブスクリプション
          </Text>

          <TouchableOpacity
            style={[
              styles.itemCard,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() => router.push('/settings/user-settings-subscription')}
          >
            <View style={styles.itemTextBox}>
              <View style={styles.planHeaderRow}>
                <Text
                  style={[
                    styles.itemTitle,
                    { color: theme.colors.textMain },
                  ]}
                >
                  現在のプラン
                </Text>

                {/* バッジ */}
                <View
                  style={[
                    styles.planBadge,
                    {
                      backgroundColor: isPro
                        ? theme.colors.primary
                        : theme.colors.surfaceAlt,
                      borderColor: isPro
                        ? 'transparent'
                        : theme.colors.borderSoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.planBadgeText,
                      {
                        color: isPro
                          ? '#FFFFFF'
                          : theme.colors.textSub,
                      },
                    ]}
                  >
                    {currentPlanLabel}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.planDescription,
                  { color: theme.colors.textSub },
                ]}
              >
                {currentPlanDesc}
              </Text>

              <Text
                style={[
                  styles.planLink,
                  { color: theme.colors.primary },
                ]}
              >
                プランの詳細・変更をみる
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

        {/* ===== 🆕 達成バッジ ===== */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textMain },
            ]}
          >
            達成バッジ
          </Text>

          <TouchableOpacity
            style={[
              styles.itemCard,
              { backgroundColor: theme.colors.card },
            ]}
            onPress={() => router.push('/settings/badges')}
          >
            <View style={styles.itemTextBox}>
              <View style={styles.badgeHeaderRow}>
                <Text
                  style={[
                    styles.itemTitle,
                    { color: theme.colors.textMain },
                  ]}
                >
                  🏅 達成バッジ
                </Text>
                <View
                  style={[
                    styles.badgeCountBadge,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text style={styles.badgeCountText}>
                    {achievedBadgeCount}/{totalBadgeCount}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.itemSubtitle,
                  { color: theme.colors.textSub },
                ]}
              >
                記録を続けるとバッジが獲得できます。あなたの頑張りを振り返りましょう。
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

        {/* ===== その他の項目 ===== */}
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
                アプリ情報
              </Text>
              <Text
                style={[
                  styles.itemSubtitle,
                  { color: theme.colors.textSub },
                ]}
              >
                利用規約・プライバシーポリシー・バージョン情報などを確認できます。
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  itemTextBox: {
    flex: 1,
    paddingRight: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  itemChevron: {
    fontSize: 22,
    fontWeight: '300',
  },

  // サブスクリプション
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
  },
  planLink: {
    fontSize: 12,
    fontWeight: '500',
  },

  // 🆕 バッジ
  badgeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  badgeCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});