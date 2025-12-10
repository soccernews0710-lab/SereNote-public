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
  TouchableOpacity,
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

import { DoctorNotesSection } from '../../src/stats/DoctorNotesSection';
import { ExportAllSection } from '../../src/stats/ExportAllSection';
import { MedsCard } from '../../src/stats/MedsCard';
import { MoodCard } from '../../src/stats/MoodCard';
import { SleepCard } from '../../src/stats/SleepCard';
import { StatsHeader } from '../../src/stats/StatsHeader';
// 行動時間カード（Pro 用）
import { ActivityCard } from '../../src/stats/ActivityCard';
// 行動 × 気分カード（Pro 用）
import { ActivityMoodCard } from '../../src/stats/ActivityMoodCard';

import {
  buildStatsRowsForPeriod,
  collectDoctorSymptoms,
  type StatsPeriod,
} from '../../src/stats/statsLogic';

// 🆕 サブスクリプション情報
import { useSubscription } from '../../src/subscription/useSubscription';

export default function StatsScreen() {
  const { theme } = useTheme();
  const { isPro, openProPaywall } = useSubscription();

  const [allEntries, setAllEntries] = useState<SerenoteEntryMap>({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<StatsPeriod>('7d');

  // ========= 共通ヘルパー =========

  // 保存ディレクトリを解決（documentDirectory → cacheDirectory の順）
  const resolveBaseDir = () =>
    FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? null;

  // CSV 用のエスケープ
  const escapeCsv = (v: string) => `"${v.replace(/"/g, '""')}"`;

  // SerenoteEntryMap → 「1行=1イベント」の詳細CSV
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
          // 気分は数値も残しておく
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

  // ファイルを共有 or パス表示
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

  // 集計済み 1日ごとの行
  const rows = useMemo(
    () => buildStatsRowsForPeriod(allEntries, period),
    [allEntries, period]
  );

  // 「診察で話したい」フラグの付いた症状一覧
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

  // ========= 3) 全データ JSON バックアップ =========

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

  // ========= 4) 全イベント CSV エクスポート（詳細） =========

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

  // ========= 5) 週間活動記録表 CSV（7日分） =========

  const handleExportWeeklySheetCsv = async () => {
    const dateKeys = Object.keys(allEntries).sort(); // YYYY-MM-DD でソート
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

      // 直近7日ぶんだけを対象（少なければその分だけ）
      const targetDates = dateKeys.slice(-7);

      // 日付 + 曜日のラベル
      const weekdayLabels = ['日', '月', '火', '水', '木', '金', '土'];
      const formattedDates = targetDates.map(d => {
        const [y, m, day] = d.split('-').map(Number);
        const dt = new Date(y, (m ?? 1) - 1, day ?? 1);
        const w = weekdayLabels[dt.getDay()] ?? '';
        return `${m}/${day}(${w})`;
      });

      // 時間帯ラベル（0〜23時）
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

      // [時間帯インデックス][日付インデックス] = セル文字列
      const table: string[][] = Array.from({ length: 24 }, () =>
        Array(targetDates.length).fill('')
      );

      // 各日付×イベントをマスに詰める
      targetDates.forEach((dateKey, colIndex) => {
        const entry = allEntries[dateKey as DateKey] as SerenoteEntry;
        const events: TimelineEvent[] =
          (entry as any).timelineEvents ?? [];

        events.forEach(ev => {
          if (!ev.time) return;
          const hour = Number(ev.time.split(':')[0]);
          if (Number.isNaN(hour) || hour < 0 || hour > 23) return;

          // セルに入れるテキスト：基本はラベル、なければ type
          let base = ev.label || ev.type;
          // メモがある場合は少しだけ付け足す（長すぎるのはカット）
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

      // CSV の構築
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

  // ========= UI本体 =========

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.container}>
        {/* タイトル + 期間スイッチ（7日 / 30日 / 90日） */}
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
          {/* 期間サマリー */}
          <OverviewCard rows={rows} periodLabel={periodLabel} />

          {/* 気分の傾向 */}
          <MoodCard rows={rows} periodLabel={periodLabel} />

          {/* 睡眠パターン */}
          <SleepCard rows={rows} periodLabel={periodLabel} />

          {/* 服薬サマリー（グラフは残すが、Pro に寄せたいなら後で切る） */}
          <MedsCard rows={rows} periodLabel={periodLabel} />

          {/* 🟣 Pro 限定：行動時間 / 行動 × 気分 */}
          {isPro ? (
            <>
              <ActivityCard rows={rows} periodLabel={periodLabel} />
              <ActivityMoodCard
                rows={rows}
                periodLabel={periodLabel}
              />
            </>
          ) : (
            <ProFeatureTeaser
              title="行動と気分のくわしい関係"
              description={
                'SereNote Pro では、行動カテゴリーごとの時間や\n' +
                '「どんな日に気分が落ち込みやすいか」をグラフで確認できます。'
              }
              onPressUpgrade={openProPaywall}
            />
          )}

          {/* 診察で話したいメモ一覧 */}
          <DoctorNotesSection
            doctorSymptoms={doctorSymptoms}
            onExport={handleExportDoctorSymptoms}
            onReset={handleResetDoctorSymptoms}
          />

          {/* 全データエクスポート（週間表 / 詳細CSV / JSON） */}
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

// ========= Pro 機能ティーザーカード =========
type ProFeatureTeaserProps = {
  title: string;
  description: string;
  onPressUpgrade: () => void;
};

const ProFeatureTeaser: React.FC<ProFeatureTeaserProps> = ({
  title,
  description,
  onPressUpgrade,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.proTeaserCard,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.borderSoft,
        },
      ]}
    >
      <Text
        style={[
          styles.proTeaserTitle,
          { color: theme.colors.textMain },
        ]}
      >
        🔒 {title}
      </Text>
      <Text
        style={[
          styles.proTeaserDescription,
          { color: theme.colors.textSub },
        ]}
      >
        {description}
      </Text>

      <TouchableOpacity
        style={[
          styles.proTeaserButton,
          { backgroundColor: theme.colors.primary },
        ]}
        onPress={onPressUpgrade}
        activeOpacity={0.85}
      >
        <Text style={styles.proTeaserButtonText}>
          SereNote Pro について見る
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ========= スタイル（画面共通） =========
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

  // Pro ティーザーカード
  proTeaserCard: {
    marginTop: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  proTeaserTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  proTeaserDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  proTeaserButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  proTeaserButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});