// app/(tabs)/stats.tsx
import * as FileSystem from 'expo-file-system/legacy'; // ← legacy API を利用
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { OverviewCard } from '../../src/stats/OverviewCard';

import {
  loadAllEntries,
  saveAllEntries,
} from '../../src/storage/serenoteStorage';
import { useTheme } from '../../src/theme/useTheme';
import type {
  DateKey,
  SerenoteEntry,
  SerenoteEntryMap,
} from '../../src/types/serenote';
import type { TimelineEvent } from '../../src/types/timeline';

import { ActivityCard } from '../../src/stats/ActivityCard';
import ActivityMoodCard from '../../src/stats/ActivityMoodCard';
import { DoctorNotesSection } from '../../src/stats/DoctorNotesSection';
import { ExportAllSection } from '../../src/stats/ExportAllSection';
import { MedsCard } from '../../src/stats/MedsCard';
import { MoodCard } from '../../src/stats/MoodCard';
import { SleepCard } from '../../src/stats/SleepCard';
import { StatsHeader } from '../../src/stats/StatsHeader';

import {
  buildStatsRowsForPeriod,
  collectDoctorSymptoms,
  type StatsPeriod,
} from '../../src/stats/statsLogic';

// サブスクリプション情報（ヘッダー用）
import { useSubscription } from '../../src/subscription/useSubscription';

export default function StatsScreen() {
  const { theme } = useTheme();
  const { isPro, openProPaywall } = useSubscription();

  const [allEntries, setAllEntries] = useState<SerenoteEntryMap>({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<StatsPeriod>('7d');

  // ========= 共通ヘルパー =========

  const resolveBaseDir = () =>
    FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? null;

  const escapeCsv = (v: string) => `"${v.replace(/"/g, '""')}"`;

  const buildCsvFromEntries = (entries: SerenoteEntryMap): string => {
    const header = [
      'date',
      'type',
      'time',
      'label_or_text',
      'memo',
      'extra',
    ]
      .map(escapeCsv)
      .join(',');

    const lines: string[] = [header];

    const sortedDates = Object.keys(entries).sort();

    sortedDates.forEach(dateKey => {
      const entry = entries[dateKey as DateKey] as SerenoteEntry;
      const events: TimelineEvent[] =
        (entry as any).timelineEvents ?? [];

      events.forEach(ev => {
        const label = ev.label ?? '';
        const memo = ev.memo ?? '';
        let extra = '';

        if (ev.type === 'mood') {
          extra = `moodValue:${(ev as any).moodValue ?? ''}`;
        } else if (ev.type === 'med') {
          const slot = (ev as any).medTimeSlot;
          const medId = (ev as any).medId;
          const dosage = (ev as any).dosageText;
          extra = [
            slot && `slot:${slot}`,
            medId && `medId:${medId}`,
            dosage && `dose:${dosage}`,
          ]
            .filter(Boolean)
            .join(' | ');
        } else if (ev.type === 'symptom') {
          if ((ev as any).forDoctor) {
            extra = 'forDoctor:true';
          }
        }

        lines.push(
          [
            dateKey,
            ev.type,
            ev.time ?? '',
            label,
            memo,
            extra,
          ]
            .map(escapeCsv)
            .join(',')
        );
      });
    });

    return lines.join('\n');
  };

  const shareFile = async (
    fileUri: string,
    mimeType: string,
    dialogTitle: string
  ) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle,
        });
      } else {
        Alert.alert('保存完了', `ファイルを保存しました:\n${fileUri}`);
      }
    } else {
      console.log('File written to', fileUri);
    }
  };

  // ========= データ読込 =========

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);

      (async () => {
        try {
          const loaded = (await loadAllEntries()) ?? {};
          if (cancelled) return;
          setAllEntries(loaded);
        } catch (e) {
          console.warn('Failed to load entries for Stats', e);
          if (!cancelled) {
            setAllEntries({});
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

  const rows = useMemo(
    () => buildStatsRowsForPeriod(allEntries, period),
    [allEntries, period]
  );

  const doctorSymptoms = useMemo(
    () => collectDoctorSymptoms(allEntries),
    [allEntries]
  );

  const periodLabel =
    period === '7d'
      ? '直近 7 日'
      : period === '30d'
      ? '直近 30 日'
      : '直近 90 日';

  // ========= 1) 診察用メモ .txt エクスポート =========

  const handleExportDoctorSymptoms = async () => {
    if (doctorSymptoms.length === 0) return;

    const lines: string[] = [];
    doctorSymptoms.forEach(item => {
      lines.push(
        `■ ${item.date}${item.time ? ` ${item.time}` : ''} ${item.label}`
      );
      if (item.memo) {
        lines.push(`  メモ: ${item.memo}`);
      }
      lines.push('');
    });

    const text = lines.join('\n');

    try {
      const baseDir = resolveBaseDir();

      if (!baseDir) {
        Alert.alert(
          'エクスポートできません',
          '保存先ディレクトリを取得できませんでした。'
        );
        return;
      }

      const fileUri =
        baseDir + `serenote-doctor-notes-${Date.now()}.txt`;

      await FileSystem.writeAsStringAsync(fileUri, text);

      await shareFile(fileUri, 'text/plain', '診察用メモを共有');
    } catch (e) {
      console.warn('Export doctor symptoms failed', e);
      Alert.alert(
        'エラー',
        'テキストの出力に失敗しました。もう一度お試しください。'
      );
    }
  };

  // ========= 2) forDoctor フラグ一括リセット =========

  const handleResetDoctorSymptoms = () => {
    if (doctorSymptoms.length === 0) return;

    Alert.alert(
      '診察メモをリセット',
      '「診察で話したい」にチェックしたフラグをすべて外します。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated: SerenoteEntryMap = {};

              Object.entries(allEntries).forEach(([date, entry]) => {
                const symptoms: any[] | undefined = (entry as any).symptoms;
                if (!symptoms || symptoms.length === 0) {
                  updated[date as DateKey] = entry as SerenoteEntry;
                  return;
                }

                const newSymptoms = symptoms.map(sym =>
                  sym.forDoctor ? { ...sym, forDoctor: false } : sym
                );

                updated[date as DateKey] = {
                  ...(entry as SerenoteEntry),
                  symptoms: newSymptoms,
                };
              });

              await saveAllEntries(updated);
              setAllEntries(updated);
            } catch (e) {
              console.warn('Failed to reset doctor symptoms', e);
              Alert.alert(
                'エラー',
                'リセットに失敗しました。もう一度お試しください。'
              );
            }
          },
        },
      ]
    );
  };

  // ========= 3〜5) エクスポート系 =========
  const handleExportAllJson = async () => {
    const hasData = Object.keys(allEntries).length > 0;
    if (!hasData) {
      Alert.alert('データがありません', 'まだ記録がありません。');
      return;
    }

    try {
      const baseDir = resolveBaseDir();
      if (!baseDir) {
        Alert.alert(
          'エクスポートできません',
          '保存先ディレクトリを取得できませんでした。'
        );
        return;
      }

      const json = JSON.stringify(allEntries, null, 2);
      const fileUri =
        baseDir + `serenote-backup-${Date.now()}.json`;

      await FileSystem.writeAsStringAsync(fileUri, json);

      await shareFile(
        fileUri,
        'application/json',
        'SereNote データ(JSON)を共有'
      );
    } catch (e) {
      console.warn('Export all JSON failed', e);
      Alert.alert(
        'エラー',
        'JSON エクスポートに失敗しました。もう一度お試しください。'
      );
    }
  };

  const handleExportAllCsv = async () => {
    const hasData = Object.keys(allEntries).length > 0;
    if (!hasData) {
      Alert.alert('データがありません', 'まだ記録がありません。');
      return;
    }

    try {
      const baseDir = resolveBaseDir();
      if (!baseDir) {
        Alert.alert(
          'エクスポートできません',
          '保存先ディレクトリを取得できませんでした。'
        );
        return;
      }

      const csvText = buildCsvFromEntries(allEntries);
      const fileUri =
        baseDir + `serenote-all-events-${Date.now()}.csv`;

      await FileSystem.writeAsStringAsync(fileUri, csvText);

      await shareFile(
        fileUri,
        'text/csv',
        'SereNote 全イベント(CSV)を共有'
      );
    } catch (e) {
      console.warn('Export all CSV failed', e);
      Alert.alert(
        'エラー',
        'CSV エクスポートに失敗しました。もう一度お試しください。'
      );
    }
  };

  const handleExportWeeklySheetCsv = async () => {
    const dateKeys = Object.keys(allEntries).sort();
    if (dateKeys.length === 0) {
      Alert.alert('データがありません', 'まだ記録がありません。');
      return;
    }

    try {
      const baseDir = resolveBaseDir();
      if (!baseDir) {
        Alert.alert(
          'エクスポートできません',
          '保存先ディレクトリを取得できませんでした。'
        );
        return;
      }

      const targetDates = dateKeys.slice(-7);

      const weekdayLabels = ['日', '月', '火', '水', '木', '金', '土'];
      const formattedDates = targetDates.map(d => {
        const [y, m, day] = d.split('-').map(Number);
        const dt = new Date(y, (m ?? 1) - 1, day ?? 1);
        const w = weekdayLabels[dt.getDay()] ?? '';
        return `${m}/${day}(${w})`;
      });

      const slotLabels = [
        '午前0〜1時',
        '午前1〜2時',
        '午前2〜3時',
        '午前3〜4時',
        '午前4〜5時',
        '午前5〜6時',
        '午前6〜7時',
        '午前7〜8時',
        '午前8〜9時',
        '午前9〜10時',
        '午前10〜11時',
        '午前11〜12時',
        '正午〜1時',
        '午後1〜2時',
        '午後2〜3時',
        '午後3〜4時',
        '午後4〜5時',
        '午後5〜6時',
        '午後6〜7時',
        '午後7〜8時',
        '午後8〜9時',
        '午後9〜10時',
        '午後10〜11時',
        '午後11〜0時',
      ];

      const table: string[][] = Array.from({ length: 24 }, () =>
        Array(targetDates.length).fill('')
      );

      targetDates.forEach((dateKey, colIndex) => {
        const entry = allEntries[dateKey as DateKey] as SerenoteEntry;
        const events: TimelineEvent[] =
          (entry as any).timelineEvents ?? [];

        events.forEach(ev => {
          if (!ev.time) return;
          const hour = Number(ev.time.split(':')[0]);
          if (Number.isNaN(hour) || hour < 0 || hour > 23) return;

          let base = ev.label || ev.type;
          if (ev.memo) {
            const short =
              ev.memo.length > 20
                ? `${ev.memo.slice(0, 20)}…`
                : ev.memo;
            base = `${base} (${short})`;
          }

          if (!base) return;

          const existing = table[hour][colIndex];
          table[hour][colIndex] = existing
            ? `${existing} / ${base}`
            : base;
        });
      });

      const header = ['時間帯', ...formattedDates]
        .map(escapeCsv)
        .join(',');
      const lines: string[] = [header];

      slotLabels.forEach((label, rowIndex) => {
        const row = [label, ...table[rowIndex]];
        lines.push(row.map(escapeCsv).join(','));
      });

      const csvText = lines.join('\n');
      const fileUri =
        baseDir + `serenote-weekly-activities-${Date.now()}.csv`;

      await FileSystem.writeAsStringAsync(fileUri, csvText);

      await shareFile(
        fileUri,
        'text/csv',
        '週間活動記録表(CSV)を共有'
      );
    } catch (e) {
      console.warn('Export weekly sheet CSV failed', e);
      Alert.alert(
        'エラー',
        '週間活動記録表のCSVエクスポートに失敗しました。もう一度お試しください。'
      );
    }
  };

  // ========= ローディング =========

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: theme.colors.textSub },
            ]}
          >
            記録を読み込み中…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ========= UI 本体 =========

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.container}>
        <StatsHeader
          period={period}
          onChangePeriod={setPeriod}
          isPro={isPro}
          onPressUpgrade={openProPaywall}
        />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <OverviewCard rows={rows} periodLabel={periodLabel} />
          <MoodCard rows={rows} periodLabel={periodLabel} />
          <SleepCard rows={rows} periodLabel={periodLabel} />
          <MedsCard rows={rows} periodLabel={periodLabel} />

          {/* 行動時間カード（内部で Pro / Free を切り替え） */}
          <ActivityCard rows={rows} periodLabel={periodLabel} />

          {/* 行動 × 気分カード（こちらも内部で Pro / Free 切替） */}
          <ActivityMoodCard
            rows={rows}
            periodLabel={periodLabel}
          />

          <DoctorNotesSection
            doctorSymptoms={doctorSymptoms}
            onExport={handleExportDoctorSymptoms}
            onReset={handleResetDoctorSymptoms}
          />

          <ExportAllSection
            onExportCsv={handleExportAllCsv}
            onExportJson={handleExportAllJson}
            onExportWeeklyCsv={handleExportWeeklySheetCsv}
          />
        </ScrollView>
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
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
  },
});