// app/settings/badges.tsx
// 達成バッジ一覧画面

import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  BadgeItem,
  BadgeSection,
  BadgeSummaryCard,
} from '../../src/badges/BadgeCard';
import {
  BADGE_DEFINITIONS,
  type BadgeCategory,
} from '../../src/badges/badgeDefinitions';
import {
  calculateAllBadgeProgress,
  calculateBadgeStats,
  getBreathingCount,
  loadAchievedBadges,
  type BadgeProgress,
} from '../../src/badges/badgeLogic';
import { loadAllEntries } from '../../src/storage/serenoteStorage';
import { useTheme } from '../../src/theme/useTheme';
import type { SerenoteEntryMap } from '../../src/types/serenote';

// カテゴリ情報
const CATEGORY_INFO: {
  category: BadgeCategory;
  title: string;
  emoji: string;
}[] = [
  { category: 'streak', title: '連続記録', emoji: '🔥' },
  { category: 'mood', title: '気分', emoji: '🙂' },
  { category: 'sleep', title: '睡眠', emoji: '😴' },
  { category: 'medication', title: '服薬', emoji: '💊' },
  { category: 'note', title: 'メモ・症状', emoji: '📝' },
  { category: 'activity', title: '行動', emoji: '🏃' },
  { category: 'special', title: '特別', emoji: '✨' },
];

export default function BadgesScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);

  // データ読み込み
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        // 並列でデータ取得
        const [entries, achievedBadges, breathingCount] = await Promise.all([
          loadAllEntries(),
          loadAchievedBadges(),
          getBreathingCount(),
        ]);

        if (cancelled) return;

        const allEntries = entries ?? {};
        const stats = calculateBadgeStats(allEntries, breathingCount);
        const progress = calculateAllBadgeProgress(stats, achievedBadges);

        setBadgeProgress(progress);
      } catch (e) {
        console.warn('Failed to load badge data', e);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // カテゴリ別にグループ化
  const badgesByCategory = useCallback(
    (category: BadgeCategory): BadgeProgress[] => {
      return badgeProgress.filter(p => p.badge.category === category);
    },
    [badgeProgress]
  );

  // サマリー計算
  const totalBadges = BADGE_DEFINITIONS.length;
  const achievedBadges = badgeProgress.filter(p => p.isAchieved).length;

  // 最近達成したバッジ（最大4つ）
  const recentBadges = badgeProgress
    .filter(p => p.isAchieved)
    .sort((a, b) => {
      const dateA = a.achievedAt ? new Date(a.achievedAt).getTime() : 0;
      const dateB = b.achievedAt ? new Date(b.achievedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 4);

  // ローディング
  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSub }]}>
            バッジを読み込み中…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backText, { color: theme.colors.primary }]}>
            ← 戻る
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textMain }]}>
          達成バッジ
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* サマリー */}
        <BadgeSummaryCard
          totalBadges={totalBadges}
          achievedBadges={achievedBadges}
          recentBadges={recentBadges}
        />

        {/* カテゴリ別セクション */}
        {CATEGORY_INFO.map(({ category, title, emoji }) => {
          const badges = badgesByCategory(category);
          if (badges.length === 0) return null;

          return (
            <BadgeSection
              key={category}
              title={title}
              emoji={emoji}
              badges={badges}
            />
          );
        })}

        {/* 説明 */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSub }]}>
            💡 毎日の記録を続けると、新しいバッジが解放されていきます。
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    minWidth: 60,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  footer: {
    marginTop: 8,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
