// components/today/TodayTimeline.tsx
import React, { memo } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { SerenoteTheme } from '../../src/theme/theme';
import { useTheme } from '../../src/theme/useTheme';
import type {
  TimelineEvent,
  TimelineEventType,
} from '../../src/types/timeline';

type Props = {
  events: TimelineEvent[];
  // 🔹 長押しされたときに呼ばれるコールバック
  onLongPressEvent?: (event: TimelineEvent) => void;
};

// 🌟 type ごとのアイコン＆カラーを定義（気分もここでは単純に event.emoji を使う）
function getEventMeta(
  event: TimelineEvent,
  theme: SerenoteTheme
): {
  icon: string;
  color: string;
} {
  const t: TimelineEventType = event.type;

  switch (t) {
    case 'wake':
      // 起床 → 青系
      return { icon: '🌅', color: theme.colors.accentBlue };
    case 'sleep':
      // 睡眠 → 専用カラー
      return { icon: '🌙', color: theme.colors.accentSleep };
    case 'med':
      // 薬
      return { icon: '💊', color: theme.colors.accentMeds };
    case 'mood':
      // 気分 → 保存されている emoji / label をそのまま使う
      return {
        icon: event.emoji ?? '🙂',
        color: theme.colors.accentMood,
      };
    case 'symptom':
      // 症状 → ノート系のアクセントを流用
      return {
        icon: event.emoji ?? '😣',
        color: theme.colors.accentNotes,
      };
    case 'activity':
      // 行動 → グリーン系
      return {
        icon: event.emoji ?? '🏃‍♂️',
        color: theme.colors.accentGreen,
      };
    case 'note':
    default:
      return {
        icon: event.emoji ?? '📝',
        color: theme.colors.accentNotes,
      };
  }
}

type ItemProps = {
  event: TimelineEvent;
  onLongPress?: () => void;
};

const TimelineItemCard: React.FC<ItemProps> = memo(
  ({ event, onLongPress }) => {
    const { theme } = useTheme();
    const { icon, color } = getEventMeta(event, theme as SerenoteTheme);
    const isPlanned = event.planned;

    // 🌟 表示用アイコン / ラベル
    const displayIcon = icon;
    const displayLabel = event.label;

    // 🌟 表示用の時間（endTime があれば 19:00 – 19:30 形式）
    const timeLabel = event.endTime
      ? `${event.time} – ${event.endTime}`
      : event.time;

    return (
      <View style={styles.itemRow}>
        {/* 左側：時間 & 縦ライン */}
        <View style={styles.timeColumn}>
          <Text
            style={[
              styles.timeText,
              { color: theme.colors.textSub },
            ]}
          >
            {timeLabel}
          </Text>
          <View style={styles.verticalLineContainer}>
            <View
              style={[
                styles.verticalLine,
                { backgroundColor: theme.colors.borderSoft },
              ]}
            />
          </View>
        </View>

        {/* 右側：カード本体 */}
        <Pressable
          style={({ pressed }) => [
            styles.card,
            {
              borderColor: theme.colors.borderSoft,
              backgroundColor: theme.colors.surface,
              opacity: pressed ? 0.6 : 1,
            },
            isPlanned && styles.cardPlanned,
          ]}
          onLongPress={onLongPress}
        >
          {/* 左のカラーライン + アイコン */}
          <View style={styles.cardLeft}>
            <View
              style={[
                styles.colorBar,
                {
                  backgroundColor: color,
                },
              ]}
            />
            <Text
              style={[
                styles.iconText,
                isPlanned && styles.iconTextPlanned,
              ]}
            >
              {displayIcon}
            </Text>
          </View>

          {/* 右のテキスト部 */}
          <View style={styles.cardContent}>
            <Text
              style={[
                styles.labelText,
                {
                  color: theme.colors.textMain,
                },
                isPlanned && styles.labelTextPlanned,
              ]}
              numberOfLines={2}
            >
              {event.type === 'mood'
                ? `気分: ${displayLabel}`
                : displayLabel}
            </Text>

            {event.memo ? (
              <Text
                style={[
                  styles.memoText,
                  { color: theme.colors.textSub },
                ]}
                numberOfLines={3}
              >
                {event.memo}
              </Text>
            ) : null}

            {event.dosageText ? (
              <Text
                style={[
                  styles.dosageText,
                  { color: theme.colors.textSub },
                ]}
              >
                {event.dosageText}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </View>
    );
  }
);

TimelineItemCard.displayName = 'TimelineItemCard';

export const Timeline: React.FC<Props> = ({
  events,
  onLongPressEvent,
}) => {
  return (
    <FlatList
      data={events}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <TimelineItemCard
          event={item}
          onLongPress={
            onLongPressEvent ? () => onLongPressEvent(item) : undefined
          }
        />
      )}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 8,
    paddingBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timeColumn: {
    width: 80, // ← 少し広げて 19:00 – 19:30 を収めやすく
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  timeText: {
    fontSize: 11,
    marginBottom: 4,
  },
  verticalLineContainer: {
    flex: 1,
    alignItems: 'center',
  },
  verticalLine: {
    width: 1,
    flex: 1,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardPlanned: {
    borderStyle: 'dashed',
    opacity: 0.9,
  },
  cardLeft: {
    alignItems: 'center',
    marginRight: 8,
  },
  colorBar: {
    width: 4,
    borderRadius: 999,
    flex: 1,
    minHeight: 24,
    marginBottom: 4,
  },
  iconText: {
    fontSize: 18,
  },
  iconTextPlanned: {
    opacity: 0.8,
  },
  cardContent: {
    flex: 1,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  labelTextPlanned: {
    opacity: 0.85,
  },
  memoText: {
    marginTop: 4,
    fontSize: 12,
  },
  dosageText: {
    marginTop: 4,
    fontSize: 11,
  },
});