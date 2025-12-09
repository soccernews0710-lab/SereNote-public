// app/settings/user-settings-activity-presets.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useActivityPresets } from '../../src/activity/useActivityPresets';
import { useTheme } from '../../src/theme/useTheme';
import type { ActivityCategory } from '../../src/types/timeline';
import { ACTIVITY_CATEGORY_META } from '../../src/types/timeline';

type CategoryMeta = {
  key: ActivityCategory;
  label: string;
  emoji: string;
};

const CATEGORY_META: CategoryMeta[] = [
  { key: 'meal', label: 'ごはん', emoji: '🍚' },
  { key: 'walk', label: '散歩', emoji: '🚶‍♂️' },
  { key: 'exercise', label: '運動', emoji: '🏃‍♂️' },
  { key: 'talk', label: '会話', emoji: '🗣️' },
  { key: 'bath', label: 'お風呂', emoji: '🛁' },
  { key: 'rest', label: '休憩', emoji: '🛌' },
  { key: 'nap', label: '昼寝', emoji: '😴' },
  { key: 'work', label: '作業', emoji: '💻' },
  { key: 'screen', label: '画面時間', emoji: '📱' },
  { key: 'out', label: '外出', emoji: '🚪' },
  { key: 'other', label: 'その他', emoji: '✅' },
];

export default function UserSettingsActivityPresetsScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const {
    presets,
    addPreset,
    updatePreset,
    deletePreset,
    resetPresets,
    loading,
  } = useActivityPresets();

  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [category, setCategory] =
    useState<ActivityCategory>('meal');
  const [label, setLabel] = useState('');
  const [minutesText, setMinutesText] = useState('');

  // 編集開始
  const startEdit = (id: string) => {
    const p = presets.find(x => x.id === id);
    if (!p) return;
    setMode('edit');
    setEditingId(id);
    setCategory(p.category);
    setLabel(p.label);
    setMinutesText(String(p.defaultMinutes));
  };

  const handleResetForm = () => {
    setMode('create');
    setEditingId(null);
    setCategory('meal');
    setLabel('');
    setMinutesText('');
  };

  const handleSubmit = () => {
    const minutes = Number(minutesText);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      Alert.alert('入力エラー', '「何分か」を 1 以上の数字で入力してください。');
      return;
    }

    if (!label.trim()) {
      Alert.alert('入力エラー', 'ラベルを入力してください。');
      return;
    }

    if (mode === 'create') {
      // ✅ ここを 3 引数で呼ぶ
      addPreset(category, label.trim(), minutes);
    } else if (mode === 'edit' && editingId) {
      updatePreset(editingId, {
        category,
        label: label.trim(),
        defaultMinutes: minutes,
      });
    }

    handleResetForm();
  };

  const handleDelete = (id: string) => {
    Alert.alert('削除しますか？', 'この行動プリセットを削除します。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => deletePreset(id),
      },
    ]);
  };

  const handleResetAll = () => {
    Alert.alert(
      '初期プリセットに戻す',
      'すべての行動プリセットをリセットして、初期状態に戻しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: () => resetPresets(),
        },
      ]
    );
  };

  const renderCategoryChip = (meta: CategoryMeta) => {
    const active = category === meta.key;
    return (
      <TouchableOpacity
        key={meta.key}
        style={[
          styles.catChip,
          {
            borderColor: active
              ? theme.colors.primary
              : theme.colors.borderSoft,
            backgroundColor: active
              ? theme.colors.primarySoft
              : theme.colors.surface,
          },
        ]}
        onPress={() => setCategory(meta.key)}
      >
        <Text
          style={{
            fontSize: 13,
            color: active
              ? theme.colors.primary
              : theme.colors.textMain,
          }}
        >
          {meta.emoji} {meta.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text
          style={[
            styles.title,
            { color: theme.colors.textMain },
          ]}
        >
          行動プリセット
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.colors.textSub },
          ]}
        >
          「ごはん」「散歩」「会話」など、よく使う行動をあらかじめ登録しておくと、
          今日の画面からすぐに呼び出せます。
        </Text>

        {/* 既存プリセット一覧 */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textMain },
            ]}
          >
            登録済みのプリセット
          </Text>

          {loading && (
            <Text
              style={[
                styles.helperText,
                { color: theme.colors.textSub },
              ]}
            >
              読み込み中…
            </Text>
          )}

          {!loading && presets.length === 0 && (
            <Text
              style={[
                styles.helperText,
                { color: theme.colors.textSub },
              ]}
            >
              まだプリセットはありません。下のフォームから追加できます。
            </Text>
          )}

          {!loading &&
            presets.map(p => (
              <View
                key={p.id}
                style={[
                  styles.presetRow,
                  { borderColor: theme.colors.borderSoft },
                ]}
              >
                <View style={styles.presetMain}>
                  <Text
                    style={[
                      styles.presetLabel,
                      { color: theme.colors.textMain },
                    ]}
                  >
                    {ACTIVITY_CATEGORY_META[p.category].emoji}{' '}
                    {p.label}
                  </Text>
                  <Text
                    style={[
                      styles.presetSub,
                      { color: theme.colors.textSub },
                    ]}
                  >
                    目安: {p.defaultMinutes} 分
                  </Text>
                </View>
                <View style={styles.presetActions}>
                  <TouchableOpacity
                    onPress={() => startEdit(p.id)}
                    style={styles.smallBtn}
                  >
                    <Text style={styles.smallBtnText}>編集</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(p.id)}
                    style={[styles.smallBtn, styles.smallBtnDanger]}
                  >
                    <Text style={styles.smallBtnDangerText}>削除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

          {!loading && presets.length > 0 && (
            <TouchableOpacity
              onPress={handleResetAll}
              style={styles.resetButton}
            >
              <Text
                style={[
                  styles.resetButtonText,
                  { color: theme.colors.textSub },
                ]}
              >
                すべてリセットして初期プリセットに戻す
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* フォーム */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textMain },
            ]}
          >
            {mode === 'create'
              ? 'プリセットを追加'
              : 'プリセットを編集'}
          </Text>

          <Text
            style={[
              styles.label,
              { color: theme.colors.textSub },
            ]}
          >
            行動の種類
          </Text>
          <View style={styles.catRow}>
            {CATEGORY_META.map(renderCategoryChip)}
          </View>

          <Text
            style={[
              styles.label,
              { color: theme.colors.textSub },
            ]}
          >
            ラベル
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.colors.borderSoft,
                backgroundColor: theme.colors.surface,
                color: theme.colors.textMain,
              },
            ]}
            placeholder="例：ゆっくり散歩"
            value={label}
            onChangeText={setLabel}
          />

          <Text
            style={[
              styles.label,
              { color: theme.colors.textSub },
            ]}
          >
            目安の時間（分）
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.colors.borderSoft,
                backgroundColor: theme.colors.surface,
                color: theme.colors.textMain,
              },
            ]}
            placeholder="例：30"
            value={minutesText}
            onChangeText={setMinutesText}
            keyboardType="number-pad"
          />

          <View style={styles.formButtons}>
            <TouchableOpacity
              onPress={handleResetForm}
              style={[
                styles.formBtn,
                styles.formBtnSecondary,
              ]}
            >
              <Text style={styles.formBtnSecondaryText}>
                クリア
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.formBtn,
                styles.formBtnPrimary,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.formBtnPrimaryText}>
                {mode === 'create' ? '追加する' : '更新する'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  presetMain: {
    flex: 1,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  presetSub: {
    fontSize: 11,
    marginTop: 2,
  },
  presetActions: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  smallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  smallBtnText: {
    fontSize: 11,
    color: '#111827',
  },
  smallBtnDanger: {
    backgroundColor: '#FEE2E2',
  },
  smallBtnDangerText: {
    fontSize: 11,
    color: '#B91C1C',
  },
  resetButton: {
    marginTop: 4,
    paddingVertical: 4,
  },
  resetButtonText: {
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  label: {
    fontSize: 13,
    marginTop: 10,
    marginBottom: 4,
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 4,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  formBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  formBtnSecondary: {
    backgroundColor: '#E5E7EB',
  },
  formBtnSecondaryText: {
    fontSize: 13,
    color: '#111827',
  },
  formBtnPrimary: {},
  formBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
});