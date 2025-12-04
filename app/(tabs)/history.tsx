// app/(tabs)/history.tsx
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { loadAllEntries } from '../../src/storage/serenoteStorage';
import { useTheme } from '../../src/theme/useTheme';
import type {
  DateKey,
  SerenoteEntry,
  SerenoteEntryMap,
  SerenoteMoodValue,
} from '../../src/types/serenote';

/**
 * 日付文字列 "YYYY-MM-DD" を、そのまま or 将来的にフォーマットしやすいように
 */
function formatDateLabel(date: DateKey): string {
  // ひとまずそのまま表示（必要になったら「2025-12-01（月）」形式に拡張してOK）
  return date;
}

/**
 * 前日の日付キーを返す（"YYYY-MM-DD" → 前日）
 */
function getPrevDateKey(date: DateKey): DateKey {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * 気分の絵文字＋ラベル
 */
function getMoodSummary(entry: SerenoteEntry): string {
  if (!entry.mood?.value) return '気分: —';

  const v: SerenoteMoodValue = entry.mood.value;
  const map: Record<SerenoteMoodValue, string> = {
    1: '😭 とてもつらい',
    2: '😣 つらい',
    3: '😐 ふつう',
    4: '🙂 少し良い',
    5: '😄 とても良い',
  };

  return `気分: ${map[v] ?? '—'}`;
}

/**
 * 睡眠サマリー（前日の就寝も考慮）
 *
 * 優先:
 *   1) 前日エントリの bedTime → 当日エントリの wakeTime
 *   2) 同じエントリ内の bedTime → wakeTime
 */
function getSleepSummaryForDate(
  date: DateKey,
  allEntries: SerenoteEntryMap
): string {
  const today = allEntries[date];
  if (!today) return '睡眠: —';

  const prevDate = getPrevDateKey(date);
  const prev = allEntries[prevDate];

  const wake = today.sleep?.wakeTime ?? null;
  const bedFromPrev = prev?.sleep?.bedTime ?? null;
  const bedFromSame = today.sleep?.bedTime ?? null;

  const bed = bedFromPrev ?? bedFromSame;

  if (!bed && !wake) return '睡眠: —';

  return `睡眠: ${bed ?? '不明'} → ${wake ?? '不明'}`;
}

/**
 * 服薬サマリー
 */
function getMedsSummary(entry: SerenoteEntry): string {
  const count = entry.medications?.length ?? 0;
  if (count === 0) return '服薬: —';
  return `服薬: ${count} 回 記録`;
}

/**
 * ノート＋症状をざっくり「どれくらい書いたか」の指標として使う
 */
function getNotesSymptomSummary(entry: SerenoteEntry): string {
  const noteCount = entry.notes?.length ?? 0;
  const symptomCount = entry.symptoms?.length ?? 0;
  const total = noteCount + symptomCount;

  if (total === 0) return 'メモ / 症状: —';

  return `メモ / 症状: ${total} 件`;
}

type HistoryRowProps = {
  entry: SerenoteEntry;
  sleepLabel: string;
  onPress?: () => void;
};

const HistoryRow: React.FC<HistoryRowProps> = ({
  entry,
  sleepLabel,
  onPress,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.rowCard,
        {
          backgroundColor: theme.colors.card,
          shadowColor: '#000000',
        },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.rowHeader}>
        <Text
          style={[
            styles.rowDateText,
            { color: theme.colors.textMain },
          ]}
        >
          {formatDateLabel(entry.date)}
        </Text>
        <Text
          style={[
            styles.rowMoodText,
            { color: theme.colors.textSub },
          ]}
        >
          {getMoodSummary(entry)}
        </Text>
      </View>

      <View style={styles.rowBottom}>
        <Text
          style={[
            styles.rowSubText,
            { color: theme.colors.textSub },
          ]}
        >
          {sleepLabel}
        </Text>
        <Text
          style={[
            styles.rowSubText,
            { color: theme.colors.textSub },
          ]}
        >
          {getMedsSummary(entry)}
        </Text>
        <Text
          style={[
            styles.rowSubText,
            { color: theme.colors.textSub },
          ]}
        >
          {getNotesSymptomSummary(entry)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function HistoryScreen() {
  const { theme } = useTheme();
  const [entries, setEntries] = useState<SerenoteEntry[]>([]);
  const [entryMap, setEntryMap] = useState<SerenoteEntryMap>({});
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // タブにフォーカスされるたびに最新データをロード
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);

      (async () => {
        try {
          const all = (await loadAllEntries()) ?? {};

          if (cancelled) return;

          setEntryMap(all);

          const arr = Object.values(all) as SerenoteEntry[];

          // 日付の新しい順にソート（"YYYY-MM-DD" なので文字列比較でOK）
          const sorted = arr.sort((a, b) =>
            a.date < b.date ? 1 : a.date > b.date ? -1 : 0
          );

          setEntries(sorted);
        } catch (e) {
          console.warn('Failed to load history entries', e);
          if (!cancelled) {
            setEntries([]);
            setEntryMap({});
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.container}>
        <Text
          style={[
            styles.screenTitle,
            { color: theme.colors.textMain },
          ]}
        >
          History
        </Text>
        <Text
          style={[
            styles.screenSubtitle,
            { color: theme.colors.textSub },
          ]}
        >
          これまでの日の記録をふりかえれます
        </Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : entries.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              { backgroundColor: theme.colors.surfaceAlt },
            ]}
          >
            <Text
              style={[
                styles.emptyTitle,
                { color: theme.colors.textMain },
              ]}
            >
              まだ記録がありません
            </Text>
            <Text
              style={[
                styles.emptyText,
                { color: theme.colors.textSub },
              ]}
            >
              Todayタブから今日の気分や睡眠、お薬などを記録すると
              ここに一覧で表示されます。
            </Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={item => item.date}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const sleepLabel = getSleepSummaryForDate(
                item.date,
                entryMap
              );
              return (
                <HistoryRow
                  entry={item}
                  sleepLabel={sleepLabel}
                  onPress={() => {
                    router.push(`/history/${item.date}`);
                  }}
                />
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  listContent: {
    paddingVertical: 4,
    gap: 8,
  },
  rowCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowDateText: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowMoodText: {
    fontSize: 13,
  },
  rowBottom: {
    marginTop: 2,
    gap: 2,
  },
  rowSubText: {
    fontSize: 12,
  },
  emptyBox: {
    marginTop: 40,
    padding: 16,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
  },
});