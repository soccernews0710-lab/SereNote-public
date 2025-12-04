// components/medication/MedicationModal.tsx
import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { TimeMode } from '../../hooks/useMedicationModal';
import type { MedTimeSlot, UserMedication } from '../../src/types/timeline';
import TimePicker from '../common/TimePicker';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  onConfirm: () => void;

  medList: UserMedication[];

  // 朝/夜/頓服など（内部ロジック用に一旦残しておく）
  selectedMedType: MedTimeSlot;
  setSelectedMedType: (slot: MedTimeSlot) => void;

  // どの薬か
  selectedMedId: string | null;
  setSelectedMedId: (id: string | null) => void;

  // 時刻
  timeMode: TimeMode;
  setTimeMode: (mode: TimeMode) => void;
  manualTime: string;
  setManualTime: (value: string) => void;

  // 名前・量・メモ
  customMedName: string;
  setCustomMedName: (value: string) => void;
  dosageText: string;
  setDosageText: (value: string) => void;
  memoText: string;
  setMemoText: (value: string) => void;

  // リマインド連動（今は見た目だけ）
  linkToReminder: boolean;
  setLinkToReminder: (value: boolean) => void;
};

export const MedicationModal: React.FC<Props> = ({
  visible,
  onRequestClose,
  onConfirm,
  medList,
  selectedMedType,      // ← いまは UI では使わないけど props としては保持
  setSelectedMedType,    // ← 同上
  selectedMedId,
  setSelectedMedId,
  timeMode,
  setTimeMode,
  manualTime,
  setManualTime,
  customMedName,
  setCustomMedName,
  dosageText,
  setDosageText,
  memoText,
  setMemoText,
  linkToReminder,
  setLinkToReminder,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onRequestClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* ヘッダー */}
          <Text style={styles.title}>お薬を登録</Text>

          {/* ⭐ スロット（朝/夜/頓服）の UI はいったん非表示にする */}

          {/* 薬一覧 */}
          <Text style={styles.sectionTitle}>薬を選ぶ</Text>
          {medList.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                まだ薬が登録されていません。{'\n'}
                設定タブから薬を追加してください。
              </Text>
            </View>
          ) : (
            <FlatList
              data={medList}
              keyExtractor={item => item.id}
              style={styles.medList}
              renderItem={({ item }) => {
                const active = item.id === selectedMedId;
                return (
                  <Pressable
                    style={[styles.medItem, active && styles.medItemActive]}
                    onPress={() => setSelectedMedId(item.id)}
                  >
                    <Text
                      style={[styles.medName, active && styles.medNameActive]}
                    >
                      {item.name}
                    </Text>
                    {item.defaultDosage ? (
                      <Text style={styles.medDosage}>
                        デフォルト量: {item.defaultDosage}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              }}
            />
          )}

          {/* カスタム名前 */}
          <Text style={styles.sectionTitle}>
            薬名（カスタム/上書き・任意）
          </Text>
          <TextInput
            style={styles.input}
            placeholder="例：クロザリル 25mg"
            value={customMedName}
            onChangeText={setCustomMedName}
          />

          {/* 量 */}
          <Text style={styles.sectionTitle}>飲んだ量</Text>
          <TextInput
            style={styles.input}
            placeholder="例：1錠 / 5mg"
            value={dosageText}
            onChangeText={setDosageText}
          />

          {/* 時刻 */}
          <Text style={styles.sectionTitle}>時刻</Text>
          <View style={styles.timeRow}>
            <TouchableOpacity
              style={[
                styles.timeModeChip,
                timeMode === 'now' && styles.timeModeChipActive,
              ]}
              onPress={() => setTimeMode('now')}
            >
              <Text
                style={[
                  styles.timeModeText,
                  timeMode === 'now' && styles.timeModeTextActive,
                ]}
              >
                今の時刻
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.timeModeChip,
                timeMode === 'manual' && styles.timeModeChipActive,
              ]}
              onPress={() => setTimeMode('manual')}
            >
              <Text
                style={[
                  styles.timeModeText,
                  timeMode === 'manual' && styles.timeModeTextActive,
                ]}
              >
                時刻を指定
              </Text>
            </TouchableOpacity>
          </View>

          {timeMode === 'manual' && (
            <View style={{ marginBottom: 6 }}>
              <TimePicker value={manualTime} onChange={setManualTime} />
            </View>
          )}

          {/* メモ */}
          <Text style={styles.sectionTitle}>メモ（症状など）</Text>
          <TextInput
            style={[styles.input, styles.memoInput]}
            placeholder="例：不安が強くなったので服用"
            value={memoText}
            onChangeText={setMemoText}
            multiline
          />

          {/* リマインド連動（将来的に通知とつなぐ） */}
          <View style={styles.reminderRow}>
            <Text style={styles.reminderLabel}>
              このスロットのリマインドと紐付け（将来用）
            </Text>
            <Switch value={linkToReminder} onValueChange={setLinkToReminder} />
          </View>

          {/* ボタン */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onRequestClose}
            >
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>追加する</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  medList: {
    maxHeight: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 6,
  },
  medItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F3',
  },
  medItemActive: {
    backgroundColor: '#EEF2FF',
  },
  medName: {
    fontSize: 13,
    color: '#333',
  },
  medNameActive: {
    fontWeight: '700',
    color: '#1D1B87',
  },
  medDosage: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FAFAFA',
  },
  emptyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#FAFAFA',
  },
  memoInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    marginTop: 2,
  },
  timeModeChip: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingVertical: 6,
    alignItems: 'center',
  },
  timeModeChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  timeModeText: {
    fontSize: 12,
    color: '#444',
  },
  timeModeTextActive: {
    color: '#1D1B87',
    fontWeight: '600',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  reminderLabel: {
    fontSize: 12,
    color: '#444',
    flex: 1,
    marginRight: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
    gap: 8,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#4F46E5',
  },
  cancelText: {
    fontSize: 13,
    color: '#111827',
  },
  confirmText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default MedicationModal;