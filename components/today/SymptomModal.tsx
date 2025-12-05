// components/today/SymptomModal.tsx
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useTheme } from '../../src/theme/useTheme';
import { TimePicker } from '../common/TimePicker';

export type SymptomModalMode = 'create' | 'edit';

type Props = {
  visible: boolean;
  mode: SymptomModalMode;
  onRequestClose: () => void;
  onConfirm: () => void;

  labelText: string;
  setLabelText: (text: string) => void;

  memoText: string;
  setMemoText: (text: string) => void;

  timeText: string;
  setTimeText: (text: string) => void;

  // 🆕 診察で話したいフラグ
  forDoctor: boolean;
  setForDoctor: (value: boolean) => void;
};

// 💡 よく使う症状プリセット
const SYMPTOM_PRESETS: string[] = [
  '不安が強い',
  'イライラする',
  '気分が落ち込む',
  '眠れない / 浅い',
  '食欲がない',
  '頭痛がある',
  '体がだるい',
  'そわそわする',
];

export default function SymptomModal({
  visible,
  mode,
  onRequestClose,
  onConfirm,
  labelText,
  setLabelText,
  memoText,
  setMemoText,
  timeText,
  setTimeText,
  forDoctor,
  setForDoctor,
}: Props) {
  const { theme } = useTheme();

  const title = mode === 'edit' ? '症状を編集' : '症状を追加';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onRequestClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
          ]}
        >
          {/* タイトル行 */}
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { color: theme.colors.textMain },
              ]}
            >
              {title}
            </Text>

            {forDoctor && (
              <View
                style={[
                  styles.doctorTag,
                  { backgroundColor: theme.colors.surfaceAlt },
                ]}
              >
                <Text style={styles.doctorTagText}>診察メモに追加</Text>
              </View>
            )}
          </View>

          {/* 時刻 */}
          <Text
            style={[
              styles.label,
              { color: theme.colors.textMain },
            ]}
          >
            時刻
          </Text>
          <TimePicker value={timeText} onChange={setTimeText} />

          {/* 症状ラベル */}
          <Text
            style={[
              styles.label,
              { color: theme.colors.textMain },
            ]}
          >
            症状
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.colors.borderSoft,
                backgroundColor: theme.colors.surfaceAlt,
                color: theme.colors.textMain,
              },
            ]}
            placeholder="例：不安が強い / 頭痛がある など"
            placeholderTextColor={theme.colors.textSub}
            value={labelText}
            onChangeText={setLabelText}
          />

          {/* 🔹 症状プリセット */}
          <Text
            style={[
              styles.subLabel,
              { color: theme.colors.textSub },
            ]}
          >
            よく使う症状（タップで入力）
          </Text>
          <View style={styles.presetsWrap}>
            {SYMPTOM_PRESETS.map(preset => {
              const active = labelText === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    {
                      borderColor: active
                        ? theme.colors.primary
                        : theme.colors.borderSoft,
                      backgroundColor: active
                        ? theme.colors.primary
                        : theme.colors.surfaceAlt,
                    },
                  ]}
                  onPress={() => setLabelText(preset)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      {
                        color: active
                          ? '#FFFFFF'
                          : theme.colors.textMain,
                      },
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 🆕 診察で話したいフラグ */}
          <TouchableOpacity
            style={[
              styles.doctorRow,
              {
                borderColor: forDoctor
                  ? theme.colors.primary
                  : theme.colors.borderSoft,
                backgroundColor: forDoctor
                  ? theme.colors.surfaceAlt
                  : 'transparent',
              },
            ]}
            onPress={() => setForDoctor(!forDoctor)}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: theme.colors.borderSoft,
                  backgroundColor: forDoctor
                    ? theme.colors.primary
                    : 'transparent',
                },
              ]}
            >
              {forDoctor && (
                <Text style={styles.checkboxCheck}>✓</Text>
              )}
            </View>
            <View style={styles.doctorTextBox}>
              <Text
                style={[
                  styles.doctorTitle,
                  { color: theme.colors.textMain },
                ]}
              >
                診察で話したい
              </Text>
              <Text
                style={[
                  styles.doctorSub,
                  { color: theme.colors.textSub },
                ]}
              >
                チェックすると Stats タブの
                「診察で話したい症状メモ」にも一覧表示されます。
              </Text>
            </View>
          </TouchableOpacity>

          {/* メモ */}
          <Text
            style={[
              styles.label,
              { color: theme.colors.textMain },
            ]}
          >
            メモ（任意）
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                borderColor: theme.colors.borderSoft,
                backgroundColor: theme.colors.surfaceAlt,
                color: theme.colors.textMain,
              },
            ]}
            placeholder="気になったこと・状況などをメモできます"
            placeholderTextColor={theme.colors.textSub}
            value={memoText}
            onChangeText={setMemoText}
            multiline
          />

          {/* ボタン行 */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { borderColor: theme.colors.borderSoft },
              ]}
              onPress={onRequestClose}
            >
              <Text
                style={[
                  styles.cancelText,
                  { color: theme.colors.textSub },
                ]}
              >
                キャンセル
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>
                保存する
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  doctorTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  doctorTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  subLabel: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // 診察で話したい
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxCheck: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  doctorTextBox: {
    flex: 1,
  },
  doctorTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  doctorSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },

  // ボタン
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 13,
  },
  confirmButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});