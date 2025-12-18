// src/badges/BadgeCard.tsx
// 達成バッジ表示コンポーネント

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '../theme/useTheme';
import {
  getRarityColor,
  getRarityLabel,
  type BadgeDefinition,
  type BadgeRarity,
} from './badgeDefinitions';
import type { BadgeProgress } from './badgeLogic';

// ─────────────────────────────────────
// 単一バッジアイテム
// ─────────────────────────────────────

type BadgeItemProps = {
  progress: BadgeProgress;
  compact?: boolean;
};

export const BadgeItem: React.FC<BadgeItemProps> = ({
  progress,
  compact = false,
}) => {
  const { theme } = useTheme();
  const { badge, isAchieved, currentValue } = progress;
  const rarityColor = getRarityColor(badge.rarity);

  if (compact) {
    // コンパクト表示（絵文字のみ）
    return (
      <View
        style={[
          styles.compactBadge,
          {
            backgroundColor: isAchieved
              ? `${rarityColor}20`
              : theme.colors.surfaceAlt,
            borderColor: isAchieved ? rarityColor : theme.colors.borderSoft,
            opacity: isAchieved ? 1 : 0.5,
          },
        ]}
      >
        <Text style={[styles.compactEmoji, { opacity: isAchieved ? 1 : 0.4 }]}>
          {badge.emoji}
        </Text>
      </View>
    );
  }

  // フル表示
  return (
    <View
      style={[
        styles.badgeItem,
        {
          backgroundColor: isAchieved
            ? `${rarityColor}15`
            : theme.colors.surfaceAlt,
          borderColor: isAchieved ? rarityColor : theme.colors.borderSoft,
        },
      ]}
    >
      {/* 絵文字 */}
      <View
        style={[
          styles.emojiContainer,
          {
            backgroundColor: isAchieved
              ? `${rarityColor}25`
              : theme.colors.background,
          },
        ]}
      >
        <Text style={[styles.emoji, { opacity: isAchieved ? 1 : 0.4 }]}>
          {badge.emoji}
        </Text>
      </View>

      {/* 情報 */}
      <View style={styles.badgeInfo}>
        <View style={styles.badgeHeader}>
          <Text
            style={[
              styles.badgeName,
              {
                color: isAchieved ? theme.colors.textMain : theme.colors.textSub,
              },
            ]}
          >
            {badge.name}
          </Text>
          {isAchieved && (
            <Text style={[styles.achievedMark, { color: rarityColor }]}>✓</Text>
          )}
        </View>

        <Text
          style={[
            styles.badgeDesc,
            { color: theme.colors.textSub },
          ]}
          numberOfLines={1}
        >
          {badge.description}
        </Text>

        {/* 進捗バー（未達成の場合） */}
        {!isAchieved && (
          <View style={styles.progressSection}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: theme.colors.borderSoft },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: rarityColor,
                    width: `${Math.min(100, progress.progress * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textSub }]}>
              {currentValue}/{badge.requirement}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ─────────────────────────────────────
// バッジセクション（カテゴリ別）
// ─────────────────────────────────────

type BadgeSectionProps = {
  title: string;
  emoji: string;
  badges: BadgeProgress[];
};

export const BadgeSection: React.FC<BadgeSectionProps> = ({
  title,
  emoji,
  badges,
}) => {
  const { theme } = useTheme();

  const achievedCount = badges.filter(b => b.isAchieved).length;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textMain }]}>
          {emoji} {title}
        </Text>
        <Text style={[styles.sectionCount, { color: theme.colors.textSub }]}>
          {achievedCount}/{badges.length}
        </Text>
      </View>

      <View style={styles.badgeList}>
        {badges.map(progress => (
          <BadgeItem key={progress.badge.id} progress={progress} />
        ))}
      </View>
    </View>
  );
};

// ─────────────────────────────────────
// バッジサマリーカード（達成数表示）
// ─────────────────────────────────────

type BadgeSummaryCardProps = {
  totalBadges: number;
  achievedBadges: number;
  recentBadges: BadgeProgress[];
};

export const BadgeSummaryCard: React.FC<BadgeSummaryCardProps> = ({
  totalBadges,
  achievedBadges,
  recentBadges,
}) => {
  const { theme } = useTheme();
  const percentage = totalBadges > 0
    ? Math.round((achievedBadges / totalBadges) * 100)
    : 0;

  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: theme.colors.card,
          shadowColor: '#000',
        },
      ]}
    >
      <View style={styles.summaryHeader}>
        <Text style={[styles.summaryTitle, { color: theme.colors.textMain }]}>
          🏅 達成バッジ
        </Text>
        <Text style={[styles.summaryCount, { color: theme.colors.primary }]}>
          {achievedBadges}/{totalBadges}
        </Text>
      </View>

      {/* 進捗バー */}
      <View
        style={[
          styles.summaryProgressBar,
          { backgroundColor: theme.colors.surfaceAlt },
        ]}
      >
        <View
          style={[
            styles.summaryProgressFill,
            {
              backgroundColor: theme.colors.primary,
              width: `${percentage}%`,
            },
          ]}
        />
      </View>

      <Text style={[styles.summaryPercentage, { color: theme.colors.textSub }]}>
        {percentage}% 達成
      </Text>

      {/* 最近のバッジ */}
      {recentBadges.length > 0 && (
        <View style={styles.recentBadges}>
          <Text style={[styles.recentLabel, { color: theme.colors.textSub }]}>
            最近の達成:
          </Text>
          <View style={styles.recentList}>
            {recentBadges.map(progress => (
              <BadgeItem
                key={progress.badge.id}
                progress={progress}
                compact
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────
// 新規達成ポップアップ用
// ─────────────────────────────────────

type NewBadgePopupProps = {
  badge: BadgeDefinition;
};

export const NewBadgePopup: React.FC<NewBadgePopupProps> = ({ badge }) => {
  const { theme } = useTheme();
  const rarityColor = getRarityColor(badge.rarity);
  const rarityLabel = getRarityLabel(badge.rarity);

  return (
    <View
      style={[
        styles.popupCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: rarityColor,
        },
      ]}
    >
      <Text style={styles.popupConfetti}>🎉</Text>
      <Text style={[styles.popupTitle, { color: theme.colors.textMain }]}>
        バッジを獲得！
      </Text>

      <View
        style={[
          styles.popupBadge,
          { backgroundColor: `${rarityColor}20` },
        ]}
      >
        <Text style={styles.popupEmoji}>{badge.emoji}</Text>
      </View>

      <Text style={[styles.popupBadgeName, { color: theme.colors.textMain }]}>
        {badge.name}
      </Text>

      <Text style={[styles.popupRarity, { color: rarityColor }]}>
        {rarityLabel}
      </Text>

      <Text style={[styles.popupDesc, { color: theme.colors.textSub }]}>
        {badge.description}
      </Text>
    </View>
  );
};

// ─────────────────────────────────────
// スタイル
// ─────────────────────────────────────

const styles = StyleSheet.create({
  // コンパクトバッジ
  compactBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight: 8,
  },
  compactEmoji: {
    fontSize: 22,
  },

  // バッジアイテム
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 26,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
  },
  achievedMark: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
  },
  badgeDesc: {
    fontSize: 11,
    marginBottom: 4,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    minWidth: 35,
    textAlign: 'right',
  },

  // セクション
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionCount: {
    fontSize: 12,
  },
  badgeList: {},

  // サマリーカード
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  summaryProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryPercentage: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 12,
  },
  recentBadges: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  recentLabel: {
    fontSize: 11,
    marginBottom: 8,
  },
  recentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // ポップアップ
  popupCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
  },
  popupConfetti: {
    fontSize: 40,
    marginBottom: 8,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  popupBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  popupEmoji: {
    fontSize: 44,
  },
  popupBadgeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  popupRarity: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  popupDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
});
