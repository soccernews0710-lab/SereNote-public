// app/settings/user-settings-data-export.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMedicationSettings } from '../../hooks/useMedicationSettings';
import { useUserSettings } from '../../hooks/useUserSettings';
import { loadAllEntries } from '../../src/storage/serenoteStorage';
import { useTheme } from '../../src/theme/useTheme';
import type { SerenoteEntryMap } from '../../src/types/serenote';

export default function DataExportScreen() {
  const router = useRouter();
  const { theme, themeName } = useTheme();
  const { loaded: userLoaded, nickname } = useUserSettings();
  const {
    loaded: medsLoaded,
    medList,
    reminderTimes,
  } = useMedicationSettings();

  const [exportJson, setExportJson] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  const ready = userLoaded && medsLoaded;

  const handleGenerateExport = async () => {
    if (!ready) return;

    setGenerating(true);
    try {
      const entries: SerenoteEntryMap =
        (await loadAllEntries()) ?? {};

      const payload = {
        version: 1,
        generatedAt: new Date().toISOString(),
        themeName,
        user: {
          nickname: nickname ?? null,
        },
        medicationSettings: {
          reminderTimes,
          meds: medList,
        },
        entries,
      };

      const json = JSON.stringify(payload, null, 2);
      setExportJson(json);
    } catch (e) {
      console.warn('Failed to build export payload', e);
      setExportJson(
        '// エクスポートの生成に失敗しました。もう一度お試しください。'
      );
    } finally {
      setGenerating(false);
    }
  };

  if (!ready) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator color={theme.colors.primary} />
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
      <ScrollView contentContainerStyle={styles.container}>
        {/* ヘッダー */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text
              style={[
                styles.backText,
                { color: theme.colors.primary },
              ]}
            >
              ‹ 戻る
            </Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.colors.textMain },
            ]}
          >
            データの出力
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <Text
          style={[
            styles.description,
            { color: theme.colors.textSub },
          ]}
        >
          SereNote の記録データ（テーマ・ニックネーム・お薬設定・
          日々のエントリ）を 1 つの JSON にまとめて表示します。
          将来的にファイル保存やインポート機能の土台として利用します。
        </Text>

        {/* ボタン */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleGenerateExport}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>
                エクスポートデータを生成する
              </Text>
            )}
          </TouchableOpacity>

          <Text
            style={[
              styles.note,
              { color: theme.colors.textSub },
            ]}
          >
            生成された JSON は、テキストとしてコピーして別の場所に
            保存しておくことで簡易バックアップとして利用できます。
          </Text>
        </View>

        {/* JSON表示 */}
        {exportJson ? (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.surfaceAlt },
            ]}
          >
            <Text
              style={[
                styles.jsonLabel,
                { color: theme.colors.textMain },
              ]}
            >
              エクスポート結果（JSON）
            </Text>
            <ScrollView
              style={styles.jsonBox}
              nestedScrollEnabled
            >
              <Text
                style={[
                  styles.jsonText,
                  { color: theme.colors.textMain },
                ]}
              >
                {exportJson}
              </Text>
            </ScrollView>
            <Text
              style={[
                styles.jsonNote,
                { color: theme.colors.textSub },
              ]}
            >
              （長押しでコピーするなどして、メモアプリ等に保存してください）
            </Text>
          </View>
        ) : null}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    fontSize: 13,
    width: 48,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 16,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600',
  },
  note: {
    marginTop: 8,
    fontSize: 11,
  },
  jsonLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  jsonBox: {
    maxHeight: 260,
    borderRadius: 8,
  },
  jsonText: {
    fontSize: 11,
    fontFamily:
      Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  jsonNote: {
    marginTop: 6,
    fontSize: 11,
  },
});