// app/stats/DoctorNotesSection.tsx
import React from 'react';
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

  return (
    <View
      style={[
        styles.sectionBox,
        {
          borderColor: theme.colors.borderSoft,
          backgroundColor: theme.colors.surfaceAlt,
        },
      ]}
    >
      {/* 見出し + ボタン */}
      <View style={styles.headerRow}>
        <View>
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
            「診察で話したい」にチェックした症状がここにまとまります
          </Text>
        </View>

        <View style={styles.actionsRow}>
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
                  ? 'transparent'
                  : theme.colors.primary,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.actionText,
                { color: disabled ? theme.colors.textSub : '#FFFFFF' },
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
                backgroundColor: 'transparent',
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
      {doctorSymptoms.length === 0 ? (
        <Text
          style={[
            styles.emptyText,
            { color: theme.colors.textSub },
          ]}
        >
          「症状」追加モーダルで「診察で話したい」にチェックすると、
          ここに一覧で表示されます。
        </Text>
      ) : (
        doctorSymptoms.map(item => (
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
        ))
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSub: {
    marginTop: 2,
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
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
    marginTop: 6,
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
});