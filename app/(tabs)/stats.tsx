// app/(tabs)/stats.tsx
import * as FileSystem from 'expo-file-system';
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

import { loadAllEntries, saveAllEntries } from '../../src/storage/serenoteStorage';
import { useTheme } from '../../src/theme/useTheme';
import type {
  DateKey,
  SerenoteEntry,
  SerenoteEntryMap,
} from '../../src/types/serenote';

import { DoctorNotesSection } from '../stats/DoctorNotesSection';
import { MedsCard } from '../stats/MedsCard';
import { MoodCard } from '../stats/MoodCard';
import { NotesCard } from '../stats/NotesCard';
import { SleepCard } from '../stats/SleepCard';
import { StatsHeader } from '../stats/StatsHeader';
import {
  buildStatsRowsForPeriod,
  collectDoctorSymptoms,
  type StatsPeriod
} from '../stats/statsLogic';

export default function StatsScreen() {
  const { theme } = useTheme();

  const [allEntries, setAllEntries] = useState<SerenoteEntryMap>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<StatsPeriod>('7d');

  // 画面フォーカスごとにデータをロード
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

  // ===== 診察用メモを .txt でエクスポート =====
  const handleExportDoctorSymptoms = async () => {
    if (doctorSymptoms.length === 0) return;

    const lines: string[] = [];

    doctorSymptoms.forEach(item => {
      lines.push(
        `■ ${item.date}${item.time ? ` ${item.time}` : ''}  ${item.label}`
      );
      if (item.memo) {
        lines.push(`  メモ: ${item.memo}`);
      }
      lines.push('');
    });

    const text = lines.join('\n');

    try {
      const fileName = `serenote-doctor-notes-${Date.now()}.txt`;

      const baseDir: string | null =
        (FileSystem as any).cacheDirectory ??
        (FileSystem as any).documentDirectory ??
        null;

      if (!baseDir) {
        console.warn('No suitable directory for export');
        return;
      }

      const fileUri = baseDir + fileName;

      await FileSystem.writeAsStringAsync(fileUri, text, {
        encoding: ((FileSystem as any).EncodingType?.UTF8 ?? 'utf8') as any,
      });

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/plain',
            dialogTitle: '診察用メモを共有',
          });
        } else {
          console.log('Sharing not available on this platform');
        }
      } else {
        console.log('File written to', fileUri);
      }
    } catch (e) {
      console.warn('Export doctor symptoms failed', e);
      Alert.alert('エラー', 'テキストの出力に失敗しました。もう一度お試しください。');
    }
  };

  // ===== forDoctor フラグを一括リセット =====
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
                  ...entry,
                  symptoms: newSymptoms,
                } as SerenoteEntry;
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

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.center}>
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

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* ヘッダー（タイトル + 期間スイッチ） */}
        <StatsHeader period={period} onChangePeriod={setPeriod} />

        {/* 各カード（気分 / 睡眠 / 服薬 / メモ） */}
        <MoodCard rows={rows} periodLabel={periodLabel} />
        <SleepCard rows={rows} periodLabel={periodLabel} />
        <MedsCard rows={rows} periodLabel={periodLabel} />
        <NotesCard rows={rows} periodLabel={periodLabel} />

        {/* 診察で話したいメモ一覧 */}
        <DoctorNotesSection
          doctorSymptoms={doctorSymptoms}
          onExport={handleExportDoctorSymptoms}
          onReset={handleResetDoctorSymptoms}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

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
});