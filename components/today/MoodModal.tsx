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
import { useTheme } from '../../src/theme/useTheme';
import TimePicker from '../common/TimePicker';

// useMoodModal で使っている MoodValue を import
import type { MoodValue } from '../../hooks/useMoodModal';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  onConfirm: () => void;

  // 1〜5 の気分値
  mood: MoodValue;
  setMood: (value: MoodValue) => void;

  memoText: string;
  setMemoText: (text: string) => void;

  timeText: string;
  setTimeText: (text: string) => void;
};

// 1〜5 に統一
// 1: とてもつらい
// 2: つらい
// 3: ふつう
// 4: 少し良い
// 5: とても良い
const MOOD_OPTIONS: { value: MoodValue; label: string; emoji: string }[] = [
  { value: 1, label: 'とてもつらい', emoji: '😭' },
  { value: 2, label: 'つらい', emoji: '😣' },
  { value: 3, label: 'ふつう', emoji: '😐' },
  { value: 4, label: '少し良い', emoji: '🙂' },
  { value: 5, label: 'とても良い', emoji: '😄' },
];

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
  const { theme } = useTheme();

  const selected = MOOD_OPTIONS.find(opt => opt.value === mood);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.backdrop}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderSoft,
                },
              ]}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <Text
                  style={[
                    styles.title,
                    { color: theme.colors.textMain },
                  ]}
                >
                  今日の気分
                </Text>

                {/* 気分ボタン列 */}
                <View style={styles.moodRow}>
                  {MOOD_OPTIONS.map(opt => {
                    const active = opt.value === mood;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.moodChip,
                          {
                            backgroundColor: active
                              ? theme.colors.primary
                              : theme.colors.surfaceAlt,
                            borderColor: active
                              ? 'transparent'
                              : theme.colors.borderSoft,
                          },
                        ]}
                        onPress={() => setMood(opt.value)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.moodEmoji,
                            {
                              color: active
                                ? '#FFFFFF'
                                : theme.colors.textMain,
                            },
                          ]}
                        >
                          {opt.emoji}
                        </Text>
                        <Text
                          style={[
                            styles.moodLabel,
                            {
                              color: active
                                ? '#FFFFFF'
                                : theme.colors.textSub,
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 選択中表示 */}
                <Text
                  style={[
                    styles.selectedText,
                    { color: theme.colors.textSub },
                  ]}
                >
                  {selected
                    ? `選択中: ${selected.emoji} ${selected.label}`
                    : 'まだ選択されていません'}
                </Text>

                {/* 🕒 時刻（TimePicker） */}
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.textSub },
                  ]}
                >
                  記録する時間
                </Text>
                <TimePicker value={timeText} onChange={setTimeText} />

                {/* メモ入力 */}
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.textSub, marginTop: 10 },
                  ]}
                >
                  メモ（任意）
                </Text>
                <TextInput
                  value={memoText}
                  onChangeText={setMemoText}
                  placeholder="気分の理由などを書いておけます"
                  placeholderTextColor={theme.colors.textSub}
                  multiline
                  style={[
                    styles.textArea,
                    {
                      color: theme.colors.textMain,
                      borderColor: theme.colors.borderSoft,
                      backgroundColor: theme.colors.surfaceAlt,
                    },
                  ]}
                  textAlignVertical="top"
                />
              </ScrollView>

              {/* ボタン行 */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { borderColor: theme.colors.borderSoft },
                  ]}
                  onPress={onRequestClose}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: theme.colors.textSub },
                    ]}
                  >
                    キャンセル
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>保存する</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  card: {
    width: '100%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    maxHeight: '90%',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  moodEmoji: {
    fontSize: 18,
    marginRight: 4,
  },
  moodLabel: {
    fontSize: 12,
  },
  selectedText: {
    fontSize: 12,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 64,
    fontSize: 13,
  },
  buttonRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});