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
import type { SymptomModalMode } from '../../hooks/useSymptomModal';
import TimePicker from '../common/TimePicker';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  onConfirm: () => void;
  labelText: string;
  setLabelText: (v: string) => void;
  memoText: string;
  setMemoText: (v: string) => void;
  timeText: string;
  setTimeText: (v: string) => void;
  mode?: SymptomModalMode; // 'create' | 'edit'
};

export const SymptomModal: React.FC<Props> = ({
  visible,
  onRequestClose,
  onConfirm,
  labelText,
  setLabelText,
  memoText,
  setMemoText,
  timeText,
  setTimeText,
  mode = 'create',
}) => {
  const title = mode === 'edit' ? '症状を編集' : '症状を記録';
  const confirmLabel = mode === 'edit' ? '更新する' : '保存する';

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          {/* 🕒 時刻（TimePicker） */}
          <Text style={styles.label}>時間</Text>
          <TimePicker value={timeText} onChange={setTimeText} />

          <Text style={styles.label}>どんな症状？</Text>
          <TextInput
            style={styles.input}
            placeholder="例：急に気分が落ち込んだ"
            value={labelText}
            onChangeText={setLabelText}
          />

          <Text style={styles.label}>メモ（任意）</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            multiline
            placeholder="例：朝から不安が強く、動けなかった"
            value={memoText}
            onChangeText={setMemoText}
            textAlignVertical="top"
          />

          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonCancel]}
              onPress={onRequestClose}
            >
              <Text style={styles.buttonTextCancel}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={onConfirm}
            >
              <Text style={styles.buttonTextPrimary}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SymptomModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  card: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
    color: '#111827',
    textAlign: 'center',
  },

  label: {
    fontSize: 13,
    marginTop: 10,
    marginBottom: 4,
    color: '#4B5563',
  },

  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
    color: '#111827',
  },

  inputMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 8,
  },

  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },

  buttonCancel: {
    backgroundColor: '#E5E7EB',
  },

  buttonPrimary: {
    backgroundColor: '#4F46E5',
  },

  buttonTextCancel: {
    color: '#111827',
    fontSize: 13,
  },

  buttonTextPrimary: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});