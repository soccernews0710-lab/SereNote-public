// components/today/ActivityModal.tsx
import React, { useState } from 'react';
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
import { useActivityPresets } from '../../src/activity/useActivityPresets';
import type { ActivityCategory } from '../../src/types/timeline';
import TimePicker from '../common/TimePicker';

/**
 * useActivityPresets 側で定義している想定の型
 */
type ActivityPreset = {
  id: string;
  category: ActivityCategory;
  label: string;
  emoji?: string;
  defaultMinutes?: number | null;
};

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  onConfirm: () => void;

  category: ActivityCategory;
  setCategory: (c: ActivityCategory) => void;

  labelText: string;
  setLabelText: (v: string) => void;

  memoText: string;
  setMemoText: (v: string) => void;

  timeText: string;
  setTimeText: (v: string) => void;

  // 終了時間（任意）
  endTimeText: string;
  setEndTimeText: (v: string) => void;

  mode?: 'create' | 'edit';
};

// HH:MM 文字列に minutes 分足す
const addMinutes = (time: string, minutes: number): string => {
  const m = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return time;

  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return time;

  let total = h * 60 + min + minutes;
  // 0–1439 に正規化
  total = ((total % (24 * 60)) + 24 * 60) % (24 * 60);

  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
};

export const ActivityModal: React.FC<Props> = ({
  visible,
  onRequestClose,
  onConfirm,
  category,
  setCategory,
  labelText,
  setLabelText,
  memoText,
  setMemoText,
  timeText,
  setTimeText,
  endTimeText,
  setEndTimeText,
  mode = 'create',
}) => {
  const { presets } = useActivityPresets();

  const title = mode === 'edit' ? '行動を編集' : '行動を記録';
  const confirmLabel = mode === 'edit' ? '更新する' : '追加する';

  // A案：タップするとピッカーが出る
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleSelectPreset = (preset: ActivityPreset) => {
    // カテゴリ & ラベルを反映
    setCategory(preset.category);
    setLabelText(preset.label);

    // defaultMinutes がある場合は終了時間を自動計算
    if (preset.defaultMinutes && preset.defaultMinutes > 0) {
      const baseTime = timeText; // openModal 時点で「今」の時刻が入っている想定
      if (baseTime) {
        const end = addMinutes(baseTime, preset.defaultMinutes);
        setEndTimeText(end);
      }
    }
  };

  const renderPresetChips = () => {
    if (!presets || presets.length === 0) return null;

    return (
      <>
        <Text style={styles.label}>よく使う行動</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetRow}
          keyboardShouldPersistTaps="handled"
        >
          {presets.map(preset => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetChip,
                category === preset.category &&
                  labelText.trim() === preset.label &&
                  styles.presetChipActive,
              ]}
              onPress={() => handleSelectPreset(preset)}
            >
              <Text style={styles.presetChipText}>
                {preset.emoji ?? ''} {preset.label}
                {preset.defaultMinutes
                  ? `（${preset.defaultMinutes}分）`
                  : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </>
    );
  };

  const handleClearEndTime = () => {
    setEndTimeText('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80} // 必要なら微調整
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

                {/* 🔹 プリセットチップ */}
                {renderPresetChips()}

                {/* 🕒 開始時間（タップでピッカー表示） */}
                <Text style={styles.label}>開始時間</Text>
                <TouchableOpacity
                  style={styles.timeInput}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.timeInputLabel}>開始</Text>
                  <Text
                    style={
                      timeText
                        ? styles.timeInputText
                        : styles.timeInputPlaceholder
                    }
                  >
                    {timeText || '--:--'}
                  </Text>
                </TouchableOpacity>

                {showStartPicker && (
                  <View style={styles.timePickerContainer}>
                    <TimePicker
                      value={timeText}
                      onChange={v => {
                        setTimeText(v);
                        setShowStartPicker(false);
                      }}
                    />
                  </View>
                )}

                {/* 🕒 終了時間（任意・タップでピッカー表示） */}
                <Text style={styles.label}>終了時間（任意）</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    style={[styles.timeInput, { flex: 1 }]}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <Text style={styles.timeInputLabel}>終了</Text>
                    <Text
                      style={
                        endTimeText
                          ? styles.timeInputText
                          : styles.timeInputPlaceholder
                      }
                    >
                      {endTimeText || '未設定'}
                    </Text>
                  </TouchableOpacity>
                  {endTimeText ? (
                    <TouchableOpacity
                      style={styles.clearEndButton}
                      onPress={handleClearEndTime}
                    >
                      <Text style={styles.clearEndButtonText}>
                        クリア
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {showEndPicker && (
                  <View style={styles.timePickerContainer}>
                    <TimePicker
                      value={endTimeText || timeText}
                      onChange={v => {
                        setEndTimeText(v);
                        setShowEndPicker(false);
                      }}
                    />
                  </View>
                )}

                <Text style={styles.helperText}>
                  終了時間を入れると、行動時間の統計に反映されます。
                </Text>

                {/* どんな行動？ */}
                <Text style={styles.label}>どんな行動？</Text>

                {/* 1段目：基本系 */}
                <View style={styles.row}>
                  <CategoryChip
                    value="meal"
                    label="ごはん"
                    emoji="🍚"
                    active={category === 'meal'}
                    onPress={() => setCategory('meal')}
                  />
                  <CategoryChip
                    value="walk"
                    label="散歩"
                    emoji="🚶‍♂️"
                    active={category === 'walk'}
                    onPress={() => setCategory('walk')}
                  />
                  <CategoryChip
                    value="exercise"
                    label="運動"
                    emoji="🏃‍♂️"
                    active={category === 'exercise'}
                    onPress={() => setCategory('exercise')}
                  />
                </View>

                {/* 2段目：休む・仕事系 */}
                <View style={styles.row}>
                  <CategoryChip
                    value="rest"
                    label="休憩"
                    emoji="😌"
                    active={category === 'rest'}
                    onPress={() => setCategory('rest')}
                  />
                  <CategoryChip
                    value="nap"
                    label="昼寝"
                    emoji="🛏️"
                    active={category === 'nap'}
                    onPress={() => setCategory('nap')}
                  />
                  <CategoryChip
                    value="work"
                    label="仕事・勉強"
                    emoji="💻"
                    active={category === 'work'}
                    onPress={() => setCategory('work')}
                  />
                </View>

                {/* 3段目：コミュニケーション・その他 */}
                <View style={styles.row}>
                  <CategoryChip
                    value="talk"
                    label="会話"
                    emoji="🗣️"
                    active={category === 'talk'}
                    onPress={() => setCategory('talk')}
                  />
                  <CategoryChip
                    value="bath"
                    label="お風呂"
                    emoji="🛁"
                    active={category === 'bath'}
                    onPress={() => setCategory('bath')}
                  />
                  <CategoryChip
                    value="screen"
                    label="画面時間"
                    emoji="📱"
                    active={category === 'screen'}
                    onPress={() => setCategory('screen')}
                  />
                  <CategoryChip
                    value="out"
                    label="外出"
                    emoji="🚆"
                    active={category === 'out'}
                    onPress={() => setCategory('out')}
                  />
                  <CategoryChip
                    value="other"
                    label="その他"
                    emoji="✅"
                    active={category === 'other'}
                    onPress={() => setCategory('other')}
                  />
                </View>

                {/* タイトル・メモ */}
                <Text style={styles.label}>タイトル（任意）</Text>
                <TextInput
                  style={styles.input}
                  placeholder="例：友達と30分電話"
                  value={labelText}
                  onChangeText={setLabelText}
                  returnKeyType="next"
                />

                <Text style={styles.label}>メモ（任意）</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  multiline
                  placeholder="例：少し気分が楽になった"
                  value={memoText}
                  onChangeText={setMemoText}
                  textAlignVertical="top"
                />
              </ScrollView>

              {/* フッターボタン */}
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
                  <Text style={styles.buttonTextPrimary}>
                    {confirmLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// 小さいカテゴリ用チップ
type CategoryChipProps = {
  value: ActivityCategory;
  label: string;
  emoji: string;
  active: boolean;
  onPress: () => void;
};

const CategoryChip: React.FC<CategoryChipProps> = ({
  label,
  emoji,
  active,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
  >
    <Text style={styles.chipText}>
      {emoji} {label}
    </Text>
  </TouchableOpacity>
);

export default ActivityModal;

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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
    textAlign: 'left',
  },
  label: {
    fontSize: 13,
    marginTop: 10,
    marginBottom: 4,
    color: '#4B5563',
  },
  helperText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  presetChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  presetChipText: {
    fontSize: 12,
    color: '#111827',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DDD',
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
    height: 70,
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
  // 時刻入力まわり
  timeInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
  },
  timeInputLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  timeInputText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  timeInputPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  timePickerContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  clearEndButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
  },
  clearEndButtonText: {
    fontSize: 11,
    color: '#4B5563',
  },
});