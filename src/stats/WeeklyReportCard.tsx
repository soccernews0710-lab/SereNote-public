// src/stats/WeeklyReportCard.tsx
// 週間レポートカード - Pro機能

import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '../theme/useTheme';
import { useSubscription } from '../subscription/useSubscription';
import type { StatsRow } from './statsLogic';
import {
  buildWeeklyReportSummary,
  generateWeeklyInsights,
  moodScoreToEmoji,
  moodScoreToLabel,
  type WeeklyInsight,
  type WeeklyReportSummary,
} from './weeklyReportLogic';

type Props = {
  rows: StatsRow[];
  periodLabel?: string;
};

/**
 * Proバッジコンポーネント
 */
const ProBadge: React.FC = () => (
  <View style={styles.proBadge}>
    <Text style={styles.proBadgeText}>Pro</Text>
  </View>
);

/**
 * インサイトカード
 */
const InsightItem: React.FC<{ insight: WeeklyInsight }> = ({ insight }) => {
  const { theme } = useTheme();

  const bgColor = useMemo(() => {
    switch (insight.type) {
      case 'positive':
        return 'rgba(34, 197, 94, 0.1)';
      case 'concern':
        return 'rgba(239, 68, 68, 0.08)';
      case 'encouragement':
        return 'rgba(59, 130, 246, 0.08)';
      default:
        return theme.colors.surfaceAlt;
    }
  }, [insight.type, theme]);

  return (
    <View style={[styles.insightItem, { backgroundColor: bgColor }]}>
      <Text style={styles.insightIcon}>{insight.icon}</Text>
      <View style={styles.insightTextBox}>
        <Text style={[styles.insightTitle, { color: theme.colors.textMain }]}>
          {insight.title}
        </Text>
        <Text style={[styles.insightMessage, { color: theme.colors.textSub }]}>
          {insight.message}
        </Text>
      </View>
    </View>
  );
};

/**
 * 週間レポートカード本体
 */
export const WeeklyReportCard: React.FC<Props> = ({
  rows,
  periodLabel = '今週',
}) => {
  const { theme } = useTheme();
  const { isPro } = useSubscription();
  const router = useRouter();

  const summary = useMemo(() => buildWeeklyReportSummary(rows), [rows]);
  const insights = useMemo(() => generateWeeklyInsights(summary), [summary]);

  // ───────────────────────────
  // Free ユーザー向けロック表示
  // ───────────────────────────
  if (!isPro) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            shadowColor: '#000',
            opacity: 0.9,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.colors.textMain }]}>
            📊 {periodLabel}のレポート
          </Text>
          <ProBadge />
        </View>

        <Text style={[styles.lockSummary, { color: theme.colors.textSub }]}>
          1週間の記録を自動で分析し、気分・睡眠・服薬の傾向や、
          あなたへのインサイト（気づき）をお届けする Pro 機能です。
        </Text>

        <View style={styles.lockBox}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>このカードは Pro 機能です</Text>
          <Text style={styles.lockDesc}>
            ・記録率と継続状況{'\n'}
            ・気分の平均・トレンド・安定度{'\n'}
            ・睡眠時間と一貫性{'\n'}
            ・あなたへのインサイト
            {'\n\n'}
            などが自動でまとまります。
          </Text>

          <TouchableOpacity
            style={[
              styles.lockButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => router.push('/settings/user-settings-subscription')}
            activeOpacity={0.9}
          >
            <Text style={styles.lockButtonText}>
              SereNote Pro について見る
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ───────────────────────────
  // Pro ユーザー向け表示
  // ───────────────────────────
  const recordPercent = Math.round(summary.recordRate * 100);
  const moodEmoji = moodScoreToEmoji(summary.avgMood);
  const moodLabel = moodScoreToLabel(summary.avgMood);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.card, shadowColor: '#000' },
      ]}
    >
      {/* ヘッダー */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.colors.textMain }]}>
          📊 {periodLabel}のレポート
        </Text>
        <ProBadge />
      </View>

      {/* サマリーグリッド */}
      <View style={styles.summaryGrid}>
        {/* 記録率 */}
        <View style={[styles.summaryItem, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Text style={styles.summaryIcon}>📝</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.textMain }]}>
            {summary.daysWithRecord}/{summary.totalDays}日
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSub }]}>
            記録した日
          </Text>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.borderSoft }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${recordPercent}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* 平均気分 */}
        <View style={[styles.summaryItem, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Text style={styles.summaryIcon}>{moodEmoji}</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.textMain }]}>
            {summary.avgMood != null ? summary.avgMood.toFixed(1) : '—'}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSub }]}>
            平均気分
          </Text>
          <Text style={[styles.summarySubLabel, { color: theme.colors.textSub }]}>
            {moodLabel}
          </Text>
        </View>

        {/* 平均睡眠 */}
        <View style={[styles.summaryItem, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Text style={styles.summaryIcon}>😴</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.textMain }]}>
            {summary.avgSleepHours != null
              ? `${summary.avgSleepHours.toFixed(1)}h`
              : '—'}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSub }]}>
            平均睡眠
          </Text>
          {summary.minSleepHours != null && summary.maxSleepHours != null && (
            <Text style={[styles.summarySubLabel, { color: theme.colors.textSub }]}>
              {summary.minSleepHours.toFixed(1)}〜{summary.maxSleepHours.toFixed(1)}h
            </Text>
          )}
        </View>

        {/* 服薬記録 */}
        <View style={[styles.summaryItem, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Text style={styles.summaryIcon}>💊</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.textMain }]}>
            {summary.daysWithMeds}日
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSub }]}>
            服薬記録
          </Text>
          <Text style={[styles.summarySubLabel, { color: theme.colors.textSub }]}>
            {Math.round(summary.medRecordRate * 100)}%
          </Text>
        </View>
      </View>

      {/* 詳細情報 */}
      <View style={[styles.detailSection, { borderTopColor: theme.colors.borderSoft }]}>
        <Text style={[styles.detailTitle, { color: theme.colors.textMain }]}>
          詳細
        </Text>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSub }]}>
            気分のトレンド
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.textMain }]}>
            {summary.moodTrend === 'up' && '📈 上向き'}
            {summary.moodTrend === 'down' && '📉 下向き'}
            {summary.moodTrend === 'stable' && '➡️ 安定'}
            {summary.moodTrend === 'unknown' && '— データ不足'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSub }]}>
            気分の安定度
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.textMain }]}>
            {summary.moodStability === 'stable' && '😌 安定'}
            {summary.moodStability === 'slightly_unstable' && '〜 やや波あり'}
            {summary.moodStability === 'unstable' && '🎢 波が大きい'}
            {summary.moodStability === 'unknown' && '— データ不足'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSub }]}>
            睡眠の一貫性
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.textMain }]}>
            {summary.sleepConsistency === 'consistent' && '✅ 規則的'}
            {summary.sleepConsistency === 'slightly_inconsistent' && '〜 ややばらつき'}
            {summary.sleepConsistency === 'inconsistent' && '⚠️ ばらつき大'}
            {summary.sleepConsistency === 'unknown' && '— データ不足'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSub }]}>
            メモ・症状
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.textMain }]}>
            {summary.totalNotes + summary.totalSymptoms}件
            <Text style={{ fontSize: 11 }}>
              {' '}(メモ{summary.totalNotes} / 症状{summary.totalSymptoms})
            </Text>
          </Text>
        </View>

        {summary.totalActivityMinutes > 0 && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSub }]}>
              行動時間
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.textMain }]}>
              {Math.round(summary.totalActivityMinutes / 60)}時間{summary.totalActivityMinutes % 60}分
              <Text style={{ fontSize: 11 }}> ({summary.daysWithActivity}日)</Text>
            </Text>
          </View>
        )}
      </View>

      {/* インサイト */}
      <View style={[styles.insightsSection, { borderTopColor: theme.colors.borderSoft }]}>
        <Text style={[styles.insightsTitle, { color: theme.colors.textMain }]}>
          💡 今週のインサイト
        </Text>
        {insights.map((insight, index) => (
          <InsightItem key={index} insight={insight} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  proBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // ロック状態
  lockSummary: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  lockBox: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  lockTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  lockDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 12,
  },
  lockButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  lockButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // サマリーグリッド
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  summaryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  summarySubLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // 詳細セクション
  detailSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
  },

  // インサイトセクション
  insightsSection: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  insightsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  insightItem: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  insightTextBox: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  insightMessage: {
    fontSize: 12,
    lineHeight: 17,
  },
});

export default WeeklyReportCard;
