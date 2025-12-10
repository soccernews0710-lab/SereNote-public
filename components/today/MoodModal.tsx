// components/today/MoodModal.tsx
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
import type { MoodValue } from '../../hooks/useMoodModal';
import TimePicker from '../common/TimePicker';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  onConfirm: () => void;

  mood: MoodValue;
  setMood: (v: MoodValue) => void;

  memoText: string;
  setMemoText: (v: string) => void;

  timeText: string;
  setTimeText: (v: string) => void;
};

const MoodModal: React.FC<Props> = ({
  visible,
  onRequestClose,
  onConfirm,
  mood,
  setMood,
  memoText,
  setMemoText,
  timeText,
  setTimeText,
}) => {
  const renderMoodChip = (value: MoodValue, label: string, emoji: string) => {
    const active = mood === value;
    return (
      <TouchableOpacity
        style={[styles.chip, active && styles.chipActive]}
        onPress={() => setMood(value)}
      >
        <Text style={styles.chipText}>
          {emoji} {label}
        </Text>
      </TouchableOpacity>
    );
  };

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
                <Text style={styles.title}>今日の気分</Text>

                {/* 🕒 時間（スロット式） */}
                <Text style={styles.label}>時間</Text>
                <TimePicker value={timeText} onChange={setTimeText} />

                <Text style={styles.label}>一番近いものを選んでください</Text>

                <View style={styles.row}>
                  {renderMoodChip(-2 as MoodValue, 'とてもつらい', '😭')}
                  {renderMoodChip(-1 as MoodValue, 'つらい', '😣')}
                </View>
                <View style={styles.row}>
                  {renderMoodChip(0 as MoodValue, 'ふつう', '😐')}
                  {renderMoodChip(1 as MoodValue, '少し良い', '🙂')}
                  {renderMoodChip(2 as MoodValue, 'とても良い', '😄')}
                </View>

                <Text style={styles.label}>メモ（任意）</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  multiline
                  placeholder="例：朝はしんどかったけど、夕方から少し楽になった"
                  value={memoText}
                  onChangeText={setMemoText}
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
                  <Text style={styles.buttonTextPrimary}>記録する</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default MoodModal;

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
    backgroundColor: '#FFF',
    padding: 16,
    maxHeight: '90%',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 10,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  chipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  chipText: {
    fontSize: 13,
    color: '#111827',
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
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
    marginTop: 16,
    gap: 8,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
});