// components/today/ActivityModal.tsx
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {
  ActivityCategory,
  ActivityModalMode,
} from '../../hooks/useActivityModal';
import TimePicker from '../common/TimePicker';

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

  mode?: ActivityModalMode; // 'create' | 'edit'
};

// "HH:MM" 文字列 → hour/minute に分解（おかしかったら現在時刻）
const parseTimeString = (t: string): { hour: number; minute: number } => {
  const now = new Date();
  let h = now.getHours();
  let m = now.getMinutes();

  if (!t) {
    return { hour: h, minute: m };
  }

  const [hs, ms] = t.split(':');
  const hh = Number(hs);
  const mm = Number(ms);

  if (!Number.isNaN(hh) && hh >= 0 && hh < 24) {
    h = hh;
  }
  if (!Number.isNaN(mm) && mm >= 0 && mm < 60) {
    m = mm;
  }

  return { hour: h, minute: m };
};

const pad2 = (n: number) => n.toString().padStart(2, '0');

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
  mode = 'create',
}) => {
  const renderCategoryButton = (
    value: ActivityCategory,
    label: string,
    emoji: string
  ) => {
    const active = category === value;
    return (
      <TouchableOpacity
        style={[styles.chip, active && styles.chipActive]}
        onPress={() => setCategory(value)}
      >
        <Text style={styles.chipText}>
          {emoji} {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const title = mode === 'edit' ? '行動を編集' : '行動を記録';
  const confirmLabel = mode === 'edit' ? '更新する' : '追加する';

  const { hour, minute } = parseTimeString(timeText);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View className="card" style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          {/* 🕒 時間（スロット式） */}
          <Text style={styles.label}>時間</Text>
          <TimePicker value={timeText} onChange={setTimeText} />

          <Text style={styles.label}>どんな行動？</Text>
          <View style={styles.row}>
            {renderCategoryButton('meal', 'ごはん', '🍚')}
            {renderCategoryButton('walk', '散歩', '🚶‍♂️')}
          </View>
          <View style={styles.row}>
            {renderCategoryButton('talk', '会話', '🗣️')}
            {renderCategoryButton('bath', 'お風呂', '🛁')}
            {renderCategoryButton('other', 'その他', '✅')}
          </View>

          <Text style={styles.label}>タイトル（任意）</Text>
          <TextInput
            style={styles.input}
            placeholder="例：友達と30分電話"
            value={labelText}
            onChangeText={setLabelText}
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

// default としても出しておく
export default ActivityModal;

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
    backgroundColor: '#FFF',
    padding: 16,
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
});