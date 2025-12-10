// components/today/NoteModal.tsx
import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { NoteModalMode } from '../../hooks/useNoteModal';
import TimePicker from '../common/TimePicker';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  onConfirm: () => void;
  noteText: string;
  setNoteText: (v: string) => void;
  timeText: string;
  setTimeText: (v: string) => void;
  mode?: NoteModalMode; // 'create' | 'edit'
};

const NoteModal: React.FC<Props> = ({
  visible,
  onRequestClose,
  onConfirm,
  noteText,
  setNoteText,
  timeText,
  setTimeText,
  mode = 'create',
}) => {
  const title = mode === 'edit' ? 'メモを編集' : 'メモを追加';
  const confirmLabel = mode === 'edit' ? '更新する' : '追加する';

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.backdrop}>
            <View style={styles.card}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.title}>{title}</Text>

                {/* 時間ピッカー */}
                <Text style={styles.label}>時間</Text>
                <TimePicker value={timeText} onChange={setTimeText} />

                <Text style={styles.label}>内容</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  multiline
                  placeholder="今日のこと・気づいたことなどを自由に書けます"
                  value={noteText}
                  onChangeText={setNoteText}
                  textAlignVertical="top"
                />
              </ScrollView>

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
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default NoteModal;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    maxHeight: '90%',
  },
  scrollContent: {
    paddingBottom: 8,
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
    minHeight: 90,
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