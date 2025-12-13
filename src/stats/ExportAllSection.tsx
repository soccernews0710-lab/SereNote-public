// app/stats/ExportAllSection.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../src/theme/useTheme';

type Props = {
  // 既存: 生の全イベントCSV
  onExportCsv: () => void;
  // 既存: JSONバックアップ
  onExportJson: () => void;
  // 🆕 週間活動記録表CSV（7日分）
  onExportWeeklyCsv: () => void;
};

export const ExportAllSection: React.FC<Props> = ({
  onExportCsv,
  onExportJson,
  onExportWeeklyCsv,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.borderSoft,
          shadowColor: '#000',
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: theme.colors.textMain },
        ]}
      >
        データエクスポート（CSV / JSON）
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: theme.colors.textSub },
        ]}
      >
        主治医に見せる資料や、自分でのバックアップ・分析用に
        データを書き出せます。
      </Text>

      {/* 🆕 週間活動記録表（生活リズム用） */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.secondaryButton,
          { backgroundColor: theme.colors.surfaceAlt },
        ]}
        onPress={onExportWeeklyCsv}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.secondaryButtonText,
            { color: theme.colors.textMain },
          ]}
        >
          週間活動記録表（7日分）を CSV で出力
        </Text>
        <Text
          style={[
            styles.buttonSub,
            { color: theme.colors.textSub },
          ]}
        >
          1時間ごと × 1日ごとのマスに、生活の記録を書き出します。
          紙の「週間活動記録表」に近い形です。
        </Text>
      </TouchableOpacity>

      {/* 既存: 全イベントを1行1イベントで書き出すCSV */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.secondaryButton,
          { backgroundColor: theme.colors.surfaceAlt },
        ]}
        onPress={onExportCsv}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.secondaryButtonText,
            { color: theme.colors.textMain },
          ]}
        >
          全イベント一覧（詳細CSV）を出力
        </Text>
        <Text
          style={[
            styles.buttonSub,
            { color: theme.colors.textSub },
          ]}
        >
          1行 = 1イベントの形式で、気分・行動・薬・メモなど
          すべてのイベントを時系列で書き出します。
        </Text>
      </TouchableOpacity>

      {/* 既存: JSONバックアップ */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.secondaryButton,
          { backgroundColor: theme.colors.surfaceAlt },
        ]}
        onPress={onExportJson}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.secondaryButtonText,
            { color: theme.colors.textMain },
          ]}
        >
          全データを JSON バックアップとして保存
        </Text>
        <Text
          style={[
            styles.buttonSub,
            { color: theme.colors.textSub },
          ]}
        >
          すべての日付・タイムラインをそのまま JSON 形式で保存します。
          開発者向け / 予備バックアップ用です。
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 10,
  },
  button: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 8,
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  secondaryButton: {},
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonSub: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
});

export default ExportAllSection;