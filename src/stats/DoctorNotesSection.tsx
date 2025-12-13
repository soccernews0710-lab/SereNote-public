// app/stats/DoctorNotesSection.tsx
import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { DoctorSymptomItem } from '../../src/stats/statsLogic';
import { useTheme } from '../../src/theme/useTheme';

type Props = {
  doctorSymptoms: DoctorSymptomItem[];
  onExport: () => void;
  onReset: () => void;
};

export const DoctorNotesSection: React.FC<Props> = ({
  doctorSymptoms,
  onExport,
  onReset,
}) => {
  const { theme } = useTheme();
  const disabled = doctorSymptoms.length === 0;

  // 直近のメモ（最大3件）だけプレビュー表示
  const { count, previewItems, restCount } = useMemo(() => {
    const count = doctorSymptoms.length;

    if (count === 0) {
      return {
        count: 0,
        previewItems: [] as DoctorSymptomItem[],
        restCount: 0,
      };
    }

    // 日付（YYYY-MM-DD）と time で新しい順にソート
    const sorted = [...doctorSymptoms].sort((a, b) => {
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      const ta = a.time ?? '';
      const tb = b.time ?? '';
      if (ta < tb) return 1;
      if (ta > tb) return -1;
      return 0;
    });

    const previewItems = sorted.slice(0, 3);
    const restCount = count > 3 ? count - 3 : 0;

    return { count, previewItems, restCount };
  }, [doctorSymptoms]);

  return (
    <View
      style={[
        styles.sectionBox,
        {
          borderColor: theme.colors.borderSoft,
          backgroundColor: theme.colors.card,
          shadowColor: '#000',
        },
      ]}
    >
      {/* 見出し + 件数 + ボタン */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textMain },
            ]}
          >
            診察で話したい症状メモ
          </Text>

          <Text
            style={[
              styles.sectionSub,
              { color: theme.colors.textSub },
            ]}
          >
            「診察で話したい」にチェックした症状のメモをまとめて確認できます。
          </Text>

          <View
            style={[
              styles.countPill,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.borderSoft,
              },
            ]}
          >
            <Text
              style={[
                styles.countText,
                { color: theme.colors.textSub },
              ]}
            >
              現在 {count} 件
            </Text>
          </View>
        </View>

        {/* 右上の操作ボタン */}
        <View style={styles.actionsColumn}>
          {/* エクスポート */}
          <TouchableOpacity
            onPress={onExport}
            disabled={disabled}
            style={[
              styles.actionButton,
              {
                borderColor: disabled
                  ? theme.colors.borderSoft
                  : theme.colors.primary,
                backgroundColor: disabled
                  ? theme.colors.surfaceAlt
                  : theme.colors.primary,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.actionText,
                {
                  color: disabled ? theme.colors.textSub : '#FFFFFF',
                },
              ]}
            >
              ↑ エクスポート
            </Text>
          </TouchableOpacity>

          {/* リセット */}
          <TouchableOpacity
            onPress={onReset}
            disabled={disabled}
            style={[
              styles.actionButton,
              {
                borderColor: theme.colors.borderSoft,
                backgroundColor: theme.colors.surfaceAlt,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.actionText,
                { color: theme.colors.textSub },
              ]}
            >
              ✓ リセット
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 本文エリア */}
      {count === 0 ? (
        <Text
          style={[
            styles.emptyText,
            { color: theme.colors.textSub },
          ]}
        >
          「症状」の記録画面で「診察で話したい」にチェックすると、
          ここに一覧で表示されます。
        </Text>
      ) : (
        <>
          {/* 直近3件だけプレビュー */}
          {previewItems.map(item => (
            <View
              key={item.id}
              style={[
                styles.symptomCard,
                { borderBottomColor: theme.colors.borderSoft },
              ]}
            >
              <Text
                style={[
                  styles.dateText,
                  { color: theme.colors.textSub },
                ]}
              >
                {item.date}
                {item.time ? `  ${item.time}` : ''}
              </Text>
              <Text
                style={[
                  styles.labelText,
                  { color: theme.colors.textMain },
                ]}
              >
                {item.label}
              </Text>
              {item.memo ? (
                <Text
                  style={[
                    styles.memoText,
                    { color: theme.colors.textSub },
                  ]}
                >
                  {item.memo}
                </Text>
              ) : null}
            </View>
          ))}

          {/* 他にまだある場合 */}
          {restCount > 0 && (
            <Text
              style={[
                styles.moreText,
                { color: theme.colors.textSub },
              ]}
            >
              ほか {restCount} 件のメモがあります。
              {'\n'}
              詳しくは History から「症状」の記録を確認してください。
            </Text>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionBox: {
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSub: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
  },
  countPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsColumn: {
    marginLeft: 8,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: 6,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  symptomCard: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    marginBottom: 2,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  memoText: {
    marginTop: 2,
    fontSize: 12,
  },
  moreText: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
  },
});

export default DoctorNotesSection;