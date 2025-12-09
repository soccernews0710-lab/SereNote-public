// components/stats/ExportAllSection.tsx
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useTheme } from '../../src/theme/useTheme';

type Props = {
  onExportCsv: () => void;
  onExportJson: () => void;
};

export const ExportAllSection: React.FC<Props> = ({
  onExportCsv,
  onExportJson,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.borderSoft,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: theme.colors.textMain },
        ]}
      >
        データエクスポート（ベータ）
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: theme.colors.textSub },
        ]}
      >
        SereNote に保存された記録をファイルとして保存・共有できます。
        バックアップや主治医との共有に使えます。
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.colors.surfaceAlt },
          ]}
          onPress={onExportCsv}
        >
          <Text
            style={[
              styles.buttonText,
              { color: theme.colors.textMain },
            ]}
          >
            全イベントを CSV で出力
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={onExportJson}
        >
          <Text
            style={[
              styles.buttonText,
              { color: '#FFFFFF' },
            ]}
          >
            全データを JSON で出力
          </Text>
        </TouchableOpacity>
      </View>

      <Text
        style={[
          styles.note,
          { color: theme.colors.textSub },
        ]}
      >
        ※ 現時点では Pro / Free 共通で利用できます（将来的に Pro 機能になる予定です）。
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
  },
  buttonRow: {
    marginTop: 10,
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  note: {
    marginTop: 6,
    fontSize: 11,
  },
});