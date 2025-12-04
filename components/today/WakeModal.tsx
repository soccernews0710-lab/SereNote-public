// components/today/WakeModal.tsx
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import TimePicker from '../common/TimePicker';

type WakeModalMode = 'create' | 'edit';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  onConfirm: () => void;

  timeText: string;
  setTimeText: (v: string) => void;

  memoText: string;
  setMemoText: (v: string) => void;

  // 編集時にタイトル・ボタン文言だけ変えたい用（渡さなければ 'create'）
  mode?: WakeModalMode;
};

const WakeModal: React.FC<Props> = ({
  visible,
  onRequestClose,
  onConfirm,
  timeText,
  setTimeText,
  memoText,
  setMemoText,
  mode = 'create',
}) => {
  const title = mode === 'edit' ? '起床を編集' : '起床を記録';
  const confirmLabel = mode === 'edit' ? '更新する' : '追加する';

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          {/* 🕒 時刻（スロット式） */}
          <Text style={styles.label}>起きた時間</Text>
          <TimePicker value={timeText} onChange={setTimeText} />

          <Text style={styles.label}>メモ（任意）</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            multiline
            placeholder="例：まだ眠気が強かった など"
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

export default WakeModal;

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