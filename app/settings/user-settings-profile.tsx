// app/settings/user-settings-profile.tsx
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    useUserSettings,
    type AgeRange,
    type Gender,
} from '../../hooks/useUserSettings';
import { uploadProfileImageAsync } from '../../src/storage/uploadProfileImage';
import { useTheme } from '../../src/theme/useTheme';

const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: '未選択', value: 'prefer_not_to_say' },
  { label: '男性', value: 'male' },
  { label: '女性', value: 'female' },
  { label: 'ノンバイナリー / その他', value: 'non_binary' },
  { label: 'その他', value: 'other' },
];

const AGE_OPTIONS: { label: string; value: AgeRange }[] = [
  { label: '選択しない', value: 'none' },
  { label: '〜17歳', value: 'under_18' },
  { label: '18〜24歳', value: '18_24' },
  { label: '25〜34歳', value: '25_34' },
  { label: '35〜44歳', value: '35_44' },
  { label: '45〜54歳', value: '45_54' },
  { label: '55歳以上', value: '55_plus' },
];

export default function UserProfileSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const {
    loaded,
    nickname,
    gender,
    ageRange,
    profileImageUri,
    updateNickname,
    updateGender,
    updateAgeRange,
    updateProfileImageUri,
  } = useUserSettings();

  const [uploading, setUploading] = useState(false);

  const pickProfileImage = useCallback(async () => {
    // 写真ライブラリの権限
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('写真ライブラリへのアクセスが許可されていません。設定から許可してください。');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1], // 正方形トリミング
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const localUri = result.assets[0].uri;

    try {
      setUploading(true);
      // 🔹 Storage にアップロードして、ダウンロードURLを取得
      const downloadURL = await uploadProfileImageAsync(localUri);
      // 🔹 設定に保存（AsyncStorage + Firestore に反映）
      await updateProfileImageUri(downloadURL);
    } catch (e) {
      console.warn(e);
      alert('画像のアップロードに失敗しました。通信状況などを確認して、もう一度お試しください。');
    } finally {
      setUploading(false);
    }
  }, [updateProfileImageUri]);

  const clearProfileImage = useCallback(async () => {
    await updateProfileImageUri(null);
  }, [updateProfileImageUri]);

  if (!loaded) {
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

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* ===== ヘッダー ===== */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>
              ‹ 戻る
            </Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.colors.textMain },
            ]}
          >
            プロフィール
          </Text>
          <View style={{ width: 48 }} />
        </View>

        {/* ===== 説明 ===== */}
        <Text
          style={[
            styles.description,
            { color: theme.colors.textSub },
          ]}
        >
          好きなキャラクターや風景の画像を設定しておくと、
          アプリを開いたときに少しホッとできるかもしれません。
          すべて任意で、いつでも変更できます。
        </Text>

        {/* ===== プロフィール画像 ===== */}
        <View style={styles.avatarSection}>
          <View
            style={[
              styles.avatarCircle,
              {
                borderColor: theme.colors.borderSoft,
                backgroundColor: theme.colors.surfaceAlt,
              },
            ]}
          >
            {uploading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : profileImageUri ? (
              <Image
                source={{ uri: profileImageUri }}
                style={styles.avatarImage}
              />
            ) : (
              <Text
                style={[
                  styles.avatarInitial,
                  { color: theme.colors.textSub },
                ]}
              >
                {nickname?.[0] ?? '🙂'}
              </Text>
            )}
          </View>

          <View style={styles.avatarButtonsRow}>
            <TouchableOpacity
              style={[
                styles.avatarButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: uploading ? 0.6 : 1,
                },
              ]}
              onPress={uploading ? undefined : pickProfileImage}
            >
              <Text style={styles.avatarButtonText}>
                {uploading ? 'アップロード中…' : '画像を選ぶ'}
              </Text>
            </TouchableOpacity>

            {profileImageUri && !uploading && (
              <TouchableOpacity
                style={[
                  styles.avatarButton,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: theme.colors.borderSoft,
                  },
                ]}
                onPress={clearProfileImage}
              >
                <Text
                  style={[
                    styles.avatarButtonTextSecondary,
                    { color: theme.colors.textSub },
                  ]}
                >
                  画像を削除
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text
            style={[
              styles.avatarNote,
              { color: theme.colors.textSub },
            ]}
          >
            好きなキャラクター・風景・言葉の画像など、
            見ていて少し気持ちがやわらぐものを選んでください。
          </Text>
        </View>

        {/* ===== ニックネーム ===== */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.textMain },
            ]}
          >
            表示名
          </Text>

          <Text
            style={[
              styles.sectionNote,
              { color: theme.colors.textSub },
            ]}
          >
            SereNote 内で表示される名前です。
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
            placeholder="例：まさたか"
            placeholderTextColor={theme.colors.textSub}
            value={nickname ?? ''}
            onChangeText={text => updateNickname(text)}
          />

          <Text
            style={[
              styles.autoSaveNote,
              { color: theme.colors.textSub },
            ]}
          >
            入力内容は自動的に保存されます。
          </Text>
        </View>

        {/* ===== 性別・年代 ===== */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card, marginTop: 16 },
          ]}
        >
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.textMain },
            ]}
          >
            任意の情報
          </Text>
          <Text
            style={[
              styles.sectionNote,
              { color: theme.colors.textSub },
            ]}
          >
            性別や年代は、個人を特定できない形で統計・機能改善のために使われます。
            公開されたり、第三者に共有されることはありません。
          </Text>

          {/* 性別 */}
          <Text
            style={[
              styles.fieldLabel,
              { color: theme.colors.textMain },
            ]}
          >
            性別（任意）
          </Text>
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.map(opt => {
              const selected = opt.value === gender;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.chip,
                    {
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.borderSoft,
                      backgroundColor: selected
                        ? theme.colors.surfaceAlt
                        : 'transparent',
                    },
                  ]}
                  onPress={() => updateGender(opt.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: selected
                          ? theme.colors.primary
                          : theme.colors.textMain,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 年代 */}
          <Text
            style={[
              styles.fieldLabel,
              { color: theme.colors.textMain },
            ]}
          >
            年代（任意）
          </Text>
          <View style={styles.chipRow}>
            {AGE_OPTIONS.map(opt => {
              const selected = opt.value === ageRange;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.chip,
                    {
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.borderSoft,
                      backgroundColor: selected
                        ? theme.colors.surfaceAlt
                        : 'transparent',
                    },
                  ]}
                  onPress={() => updateAgeRange(opt.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: selected
                          ? theme.colors.primary
                          : theme.colors.textMain,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ===== 今後追加予定 ===== */}
        <View
          style={[
            styles.futureCard,
            { borderColor: theme.colors.borderSoft },
          ]}
        >
          <Text
            style={[
              styles.futureTitle,
              { color: theme.colors.textMain },
            ]}
          >
            追加予定の項目
          </Text>
          <Text
            style={[
              styles.futureText,
              { color: theme.colors.textSub },
            ]}
          >
            ・このアプリを主に何に使いたいか（気持ちの整理 / 振り返り など）{'\n'}
            ・よく使う時間帯（朝 / 夜 など）
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const AVATAR_SIZE = 96;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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

  description: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },

  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    resizeMode: 'cover',
  },
  avatarInitial: {
    fontSize: 32,
  },
  avatarButtonsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  avatarButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  avatarButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarButtonTextSecondary: {
    fontSize: 12,
    fontWeight: '500',
  },
  avatarNote: {
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 16,
  },

  card: {
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  sectionNote: {
    fontSize: 11,
    marginBottom: 8,
    lineHeight: 16,
  },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },

  autoSaveNote: {
    marginTop: 8,
    fontSize: 11,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  chipRow: {
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
  },
  chipText: {
    fontSize: 12,
  },

  futureCard: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  futureTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  futureText: {
    fontSize: 11,
    lineHeight: 16,
  },
});