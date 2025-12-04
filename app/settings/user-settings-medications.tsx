// app/settings/user-settings-medications.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMedicationSettings } from '../../hooks/useMedicationSettings';
import { useTheme } from '../../src/theme/useTheme';

export default function MedicationSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const {
    loaded: medsLoaded,
    medList,
    reminderTimes,
    addMedication,
    updateMedication,
    removeMedication,
    setReminderTime,
  } = useMedicationSettings();

  // 新規お薬追加用 state
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');

  if (!medsLoaded) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const handleAddMed = async () => {
    const name = newMedName.trim();
    if (!name) {
      Alert.alert('お薬名を入力してください');
      return;
    }
    try {
      await addMedication(name, newMedDosage.trim() || undefined);
      setNewMedName('');
      setNewMedDosage('');
    } catch (e) {
      console.warn(e);
      Alert.alert('お薬の追加に失敗しました');
    }
  };

  const handleDeleteMed = (id: string) => {
    Alert.alert('削除確認', 'このお薬を一覧から削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMedication(id);
          } catch (e) {
            console.warn(e);
            Alert.alert('削除に失敗しました');
          }
        },
      },
    ]);
  };

  const handleChangeReminder = async (
    slot: 'morning' | 'night',
    value: string
  ) => {
    await setReminderTime(slot, value.trim() || null);
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* ヘッダー */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text
              style={[
                styles.backText,
                { color: theme.colors.primary },
              ]}
            >
              ‹ 戻る
            </Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.colors.textMain },
            ]}
          >
            お薬の設定
          </Text>
          <View style={{ width: 48 }} />
        </View>

        {/* リマインド時刻 */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.textMain },
          ]}
        >
          リマインド時刻
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text
            style={[
              styles.label,
              { color: theme.colors.textMain },
            ]}
          >
            朝のリマインド時刻（例：08:00）
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
            placeholder="08:00"
            placeholderTextColor={theme.colors.textSub}
            keyboardType="numbers-and-punctuation"
            value={reminderTimes.morning ?? ''}
            onChangeText={text =>
              handleChangeReminder('morning', text)
            }
          />

          <Text
            style={[
              styles.label,
              { color: theme.colors.textMain },
            ]}
          >
            夜のリマインド時刻（例：20:00）
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
            placeholder="20:00"
            placeholderTextColor={theme.colors.textSub}
            keyboardType="numbers-and-punctuation"
            value={reminderTimes.night ?? ''}
            onChangeText={text =>
              handleChangeReminder('night', text)
            }
          />

          <Text
            style={[
              styles.note,
              { color: theme.colors.textSub },
            ]}
          >
            ※ ここで設定した時刻は、今後の通知機能と連動させることを想定しています。
          </Text>
        </View>

        {/* お薬一覧 */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.textMain },
          ]}
        >
          登録しているお薬
        </Text>
        {medList.length === 0 ? (
          <Text
            style={[
              styles.emptyText,
              { color: theme.colors.textSub },
            ]}
          >
            まだ登録されているお薬はありません。
            下の「新しいお薬を追加」から登録できます。
          </Text>
        ) : (
          medList.map(med => (
            <View
              key={med.id}
              style={[
                styles.medCard,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <Text
                style={[
                  styles.medHeader,
                  { color: theme.colors.textSub },
                ]}
              >
                お薬ID: {med.id}
              </Text>

              <Text
                style={[
                  styles.label,
                  { color: theme.colors.textMain },
                ]}
              >
                名前
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
                placeholder="例：クロザリル 25mg"
                placeholderTextColor={theme.colors.textSub}
                value={med.name}
                onChangeText={text =>
                  updateMedication(med.id, { name: text })
                }
              />

              <Text
                style={[
                  styles.label,
                  { color: theme.colors.textMain },
                ]}
              >
                デフォルト量（任意）
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
                placeholder="例：1錠 / 25mg"
                placeholderTextColor={theme.colors.textSub}
                value={med.defaultDosage ?? ''}
                onChangeText={text =>
                  updateMedication(med.id, {
                    defaultDosage: text || undefined,
                  })
                }
              />

              <View style={styles.medFooterRow}>
                <Text
                  style={[
                    styles.medFooterText,
                    { color: theme.colors.textSub },
                  ]}
                >
                  Today 画面の「＋ お薬」から選択できます
                </Text>
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    { borderColor: theme.colors.accentNotes },
                  ]}
                  onPress={() => handleDeleteMed(med.id)}
                >
                  <Text
                    style={[
                      styles.deleteButtonText,
                      { color: theme.colors.accentNotes },
                    ]}
                  >
                    削除
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* 新しいお薬を追加 */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.textMain },
          ]}
        >
          新しいお薬を追加
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text
            style={[
              styles.label,
              { color: theme.colors.textMain },
            ]}
          >
            名前
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
            placeholder="例：クロザリル 25mg"
            placeholderTextColor={theme.colors.textSub}
            value={newMedName}
            onChangeText={setNewMedName}
          />

          <Text
            style={[
              styles.label,
              { color: theme.colors.textMain },
            ]}
          >
            デフォルト量（任意）
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
            placeholder="例：1錠 / 25mg"
            placeholderTextColor={theme.colors.textSub}
            value={newMedDosage}
            onChangeText={setNewMedDosage}
          />

          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleAddMed}
          >
            <Text style={styles.addButtonText}>
              お薬を追加する
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={[
            styles.bottomNote,
            { color: theme.colors.textSub },
          ]}
        >
          ここで登録したお薬は、Today 画面の「＋ お薬」から選択して
          タイムラインに記録できます。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    fontSize: 13,
    width: 48,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
  },
  card: {
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  note: {
    marginTop: 8,
    fontSize: 11,
  },
  emptyText: {
    fontSize: 12,
    marginBottom: 8,
  },
  medCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  medHeader: {
    fontSize: 11,
  },
  medFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  medFooterText: {
    fontSize: 11,
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addButton: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600',
  },
  bottomNote: {
    marginTop: 16,
    fontSize: 11,
  },
});