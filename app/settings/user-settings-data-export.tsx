// app/settings/user-settings-data-export.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProFeatureGate } from '../../components/common/ProFeatureGate';
import { loadAllEntries } from '../../src/storage/serenoteStorage';
import { useSubscription } from '../../src/subscription/useSubscription';
import { useTheme } from '../../src/theme/useTheme';

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function UserSettingsDataExportScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { plan, isPro, setPlan } = useSubscription(); // ← デバッグ用切り替えも継続
  const [exporting, setExporting] = useState(false);

  const handleExportAll = async () => {
    if (!isPro) {
      Alert.alert('Pro専用機能', 'SereNote Pro でご利用いただける機能です。');
      return;
    }

    try {
      setExporting(true);

      // 1) すべての記録を取得
      const allEntries = (await loadAllEntries()) ?? {};
      const keys = Object.keys(allEntries);

      if (keys.length === 0) {
        Alert.alert(
          'データがありません',
          'まだ保存されている記録がないため、出力できるデータがありません。'
        );
        return;
      }

      // 2) JSON に変換（人間が読めるようにインデント付き）
      const json = JSON.stringify(allEntries, null, 2);

      // 3) ファイルパスを生成
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');

      const fileName = `serenote-export-${y}${m}${d}-${hh}${mm}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // 4) JSON ファイルとして書き出し
      await FileSystem.writeAsStringAsync(fileUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // 5) 共有ダイアログ（ファイルApp / AirDrop / メールなど）
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'SereNote データを書き出す',
          UTI: 'public.json',
        });
      } else {
        // 万が一共有できない環境の場合
        Alert.alert(
          'エクスポート完了',
          `アプリ内ストレージにファイルを保存しました。\n\nパス: ${fileUri}`
        );
      }
    } catch (e) {
      console.warn('Export failed', e);
      Alert.alert(
        'エクスポートに失敗しました',
        'もう一度お試しください。'
      );
    } finally {
      setExporting(false);
    }
  };

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
            <Text style={[styles.backText, { color: theme.colors.primary }]}>
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

        {/* (デバッグ用) プラン表示・切替 */}
        <View
          style={[
            styles.planBadge,
            { backgroundColor: theme.colors.surfaceAlt },
          ]}
        >
          <Text
            style={[
              styles.planText,
              { color: theme.colors.textSub },
            ]}
          >
            現在のプラン: {plan === 'free' ? 'Free（無料）' : 'Pro（有料）'}
          </Text>
          <TouchableOpacity
            style={[
              styles.planToggleButton,
              { borderColor: theme.colors.borderSoft },
            ]}
            onPress={() => {
              setPlan(isPro ? 'free' : 'pro');
            }}
          >
            <Text
              style={[
                styles.planToggleButtonText,
                { color: theme.colors.textMain },
              ]}
            >
              {isPro ? 'Free に切り替え（デバッグ）' : 'Pro に切り替え（デバッグ）'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pro 専用機能としての本体 */}
        <ProFeatureGate featureName="データの出力">
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.textMain },
              ]}
            >
              エクスポートの概要
            </Text>
            <Text
              style={[
                styles.bodyText,
                { color: theme.colors.textSub },
              ]}
            >
              SereNote に保存されている全ての記録データを、
              1つの JSON ファイルとして書き出します。
              将来的には日付範囲の指定や CSV 出力にも対応予定です。
            </Text>

            <View style={styles.bulletList}>
              <Text
                style={[
                  styles.bulletItem,
                  { color: theme.colors.textSub },
                ]}
              >
                ・対象: これまでに保存した全日分の記録
              </Text>
              <Text
                style={[
                  styles.bulletItem,
                  { color: theme.colors.textSub },
                ]}
              >
                ・形式: JSON（開発者や研究医向けの詳細データ）
              </Text>
              <Text
                style={[
                  styles.bulletItem,
                  { color: theme.colors.textSub },
                ]}
              >
                ・保存先: ファイルアプリ / メール / AirDrop などへ共有
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.exportButton,
                {
                  backgroundColor: exporting
                    ? theme.colors.surfaceAlt
                    : theme.colors.primary,
                },
              ]}
              onPress={handleExportAll}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.exportButtonText}>
                  全データを JSON で書き出す
                </Text>
              )}
            </TouchableOpacity>

            <Text
              style={[
                styles.noteText,
                { color: theme.colors.textSub },
              ]}
            >
              ※ 個人用バックアップや、主治医・研究者への共有を想定しています。
              ファイルの取り扱いには十分ご注意ください。
            </Text>
          </View>
        </ProFeatureGate>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  bulletList: {
    marginVertical: 4,
    gap: 2,
  },
  bulletItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  exportButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  noteText: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
  },
  planBadge: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  planText: {
    fontSize: 11,
    marginBottom: 4,
  },
  planToggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  planToggleButtonText: {
    fontSize: 11,
    fontWeight: '500',
  },
});