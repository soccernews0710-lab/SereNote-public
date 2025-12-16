// app/settings/user-settings-profile.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, type User } from 'firebase/auth';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUserSettings, type AgeRange, type Gender } from '../../hooks/useUserSettings';
import { signInWithGoogleNative, signOutGoogleNative } from '../../src/auth/googleSignIn';
import { restoreAllDaysFromCloud, saveDayToCloud } from '../../src/cloud/dayCloud';
import { auth } from '../../src/firebase';
import { loadAllEntries } from '../../src/storage/serenoteStorage';
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

const LAST_BACKUP_KEY = 'SERENOTE_LAST_CLOUD_BACKUP_AT_V1';
const LAST_RESTORE_KEY = 'SERENOTE_LAST_CLOUD_RESTORE_AT_V1';

function formatJst(ts: number) {
  try {
    return new Date(ts).toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(ts).toISOString();
  }
}

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
  const [authBusy, setAuthBusy] = useState(false);
  const [cloudBusy, setCloudBusy] = useState(false);

  // auth.currentUser は reactive じゃないので state で追う
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  // 最終バックアップ/復元（端末ローカル）
  const [lastBackupAt, setLastBackupAt] = useState<number | null>(null);
  const [lastRestoreAt, setLastRestoreAt] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setCurrentUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const b = await AsyncStorage.getItem(LAST_BACKUP_KEY);
        const r = await AsyncStorage.getItem(LAST_RESTORE_KEY);
        const bNum = b ? Number(b) : NaN;
        const rNum = r ? Number(r) : NaN;
        setLastBackupAt(Number.isFinite(bNum) ? bNum : null);
        setLastRestoreAt(Number.isFinite(rNum) ? rNum : null);
      } catch {
        // noop
      }
    })();
  }, []);

  const authState = useMemo(() => {
    const u = currentUser;
    if (!u) return { label: '未ログイン', isAnonymous: true, email: null as string | null };
    if (u.isAnonymous) return { label: '匿名', isAnonymous: true, email: null as string | null };
    return { label: 'ログイン済み', isAnonymous: false, email: u.email ?? null };
  }, [currentUser]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setAuthBusy(true);
      await signInWithGoogleNative();
    } catch (e: any) {
      console.warn('Google sign-in failed', e);
      alert(
        e?.message
          ? `ログインに失敗しました: ${e.message}`
          : 'ログインに失敗しました。もう一度お試しください。'
      );
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const handleGoogleSignOut = useCallback(async () => {
    try {
      setAuthBusy(true);
      await signOutGoogleNative();
    } catch (e: any) {
      console.warn('Google sign-out failed', e);
      alert(
        e?.message
          ? `ログアウトに失敗しました: ${e.message}`
          : 'ログアウトに失敗しました。もう一度お試しください。'
      );
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const pickProfileImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('写真ライブラリへのアクセスが許可されていません。設定から許可してください。');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const localUri = result.assets[0].uri;

    try {
      setUploading(true);
      const downloadURL = await uploadProfileImageAsync(localUri);
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

  /**
   * ローカル → クラウド（全期間バックアップ）
   */
  const backupAllToCloud = useCallback(async () => {
    if (authState.isAnonymous) {
      Alert.alert('Googleログインが必要', 'クラウドバックアップはGoogleログイン後に使えます。');
      return;
    }

    const ok = await new Promise<boolean>(resolve => {
      Alert.alert(
        'クラウドにバックアップ',
        'この端末の記録（全期間）をクラウドにバックアップします。\n\n※クラウド側が空の初回におすすめ',
        [
          { text: 'キャンセル', style: 'cancel', onPress: () => resolve(false) },
          { text: 'バックアップ', style: 'default', onPress: () => resolve(true) },
        ]
      );
    });

    if (!ok) return;

    try {
      setCloudBusy(true);

      const map = await loadAllEntries();
      const dateKeys = Object.keys(map ?? {});
      if (dateKeys.length === 0) {
        Alert.alert('バックアップ対象なし', 'ローカルに記録がありません。');
        return;
      }

      let saved = 0;
      for (const dateKey of dateKeys) {
        const res = await saveDayToCloud(dateKey, { requireNonAnonymous: true });
        if (!res.skipped) saved += 1;
      }

      const now = Date.now();
      setLastBackupAt(now);
      try {
        await AsyncStorage.setItem(LAST_BACKUP_KEY, String(now));
      } catch {
        // noop
      }

      Alert.alert('バックアップ完了', `クラウドに保存: ${saved}日分`);
    } catch (e: any) {
      console.warn('[backupAllToCloud] failed', e);
      Alert.alert('バックアップ失敗', e?.message ? String(e.message) : 'バックアップに失敗しました。');
    } finally {
      setCloudBusy(false);
    }
  }, [authState.isAnonymous]);

  /**
   * クラウド → ローカル（全期間復元）
   */
  const restoreFromCloud = useCallback(
    async (mode: 'overwrite' | 'preferLocal') => {
      if (authState.isAnonymous) {
        Alert.alert('Googleログインが必要', 'クラウド復元はGoogleログイン後に使えます。');
        return;
      }

      const title =
        mode === 'overwrite' ? 'クラウドから復元（上書き）' : 'クラウドから復元（ローカル優先）';
      const message =
        mode === 'overwrite'
          ? 'クラウドの内容でローカルを上書きします。\n\n※端末の記録が消える可能性があります'
          : '同じ日付がローカルにある場合は、ローカルを優先して残します。\n\n※安全寄りの復元';

      const ok = await new Promise<boolean>(resolve => {
        Alert.alert(title, message, [
          { text: 'キャンセル', style: 'cancel', onPress: () => resolve(false) },
          { text: '復元する', style: 'destructive', onPress: () => resolve(true) },
        ]);
      });

      if (!ok) return;

      try {
        setCloudBusy(true);

        const res = await restoreAllDaysFromCloud({
          requireNonAnonymous: true,
          preferLocal: mode === 'preferLocal',
        });

        const now = Date.now();
        setLastRestoreAt(now);
        try {
          await AsyncStorage.setItem(LAST_RESTORE_KEY, String(now));
        } catch {
          // noop
        }

        Alert.alert('復元完了', `クラウド: ${res.cloudCount}件\n復元: ${res.restoredCount}件`);
      } catch (e: any) {
        console.warn('[restoreFromCloud] failed', e);
        Alert.alert('復元失敗', e?.message ? String(e.message) : '復元に失敗しました。');
      } finally {
        setCloudBusy(false);
      }
    },
    [authState.isAnonymous]
  );

  if (!loaded) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* ===== ヘッダー ===== */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>‹ 戻る</Text>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.colors.textMain }]}>プロフィール</Text>

          <View style={{ width: 48 }} />
        </View>

        {/* ===== 説明 ===== */}
        <Text style={[styles.description, { color: theme.colors.textSub }]}>
          好きなキャラクターや風景の画像を設定しておくと、
          アプリを開いたときに少しホッとできるかもしれません。
          すべて任意で、いつでも変更できます。
        </Text>

        {/* ✅ アバターを一番上へ移動 */}
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
              <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarInitial, { color: theme.colors.textSub }]}>
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
                <Text style={[styles.avatarButtonTextSecondary, { color: theme.colors.textSub }]}>
                  画像を削除
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.avatarNote, { color: theme.colors.textSub }]}>
            好きなキャラクター・風景・言葉の画像など、
            見ていて少し気持ちがやわらぐものを選んでください。
          </Text>
        </View>

        {/* ===== ログイン（Google / ログアウト切替） ===== */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, marginBottom: 16 }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textMain }]}>アカウント</Text>

          <Text style={[styles.sectionNote, { color: theme.colors.textSub }]}>
            Googleでログインすると端末変更時もデータを引き継げます。
          </Text>

          <View style={styles.accountRow}>
            <Text style={[styles.accountStatus, { color: theme.colors.textSub }]}>
              現在: {authState.label}
              {authState.email ? `（${authState.email}）` : ''}
            </Text>
          </View>

          {authState.isAnonymous ? (
            <TouchableOpacity
              style={[
                styles.authButton,
                { backgroundColor: theme.colors.primary, opacity: authBusy ? 0.6 : 1 },
              ]}
              onPress={authBusy ? undefined : handleGoogleSignIn}
              activeOpacity={0.85}
            >
              <Text style={styles.authButtonText}>{authBusy ? 'ログイン中…' : 'Googleでログイン'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.authButtonOutline,
                {
                  borderColor: theme.colors.borderSoft,
                  backgroundColor: theme.colors.surfaceAlt,
                  opacity: authBusy ? 0.6 : 1,
                },
              ]}
              onPress={authBusy ? undefined : handleGoogleSignOut}
              activeOpacity={0.85}
            >
              <Text style={[styles.authButtonOutlineText, { color: theme.colors.textMain }]}>
                {authBusy ? 'ログアウト中…' : 'ログアウト'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ===== クラウド（バックアップ/復元） ===== */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, marginBottom: 16 }]}>
          <View style={styles.cloudHeaderRow}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textMain }]}>
              クラウド（バックアップ/復元）
            </Text>
            {cloudBusy ? <ActivityIndicator color={theme.colors.primary} /> : null}
          </View>

          <Text style={[styles.sectionNote, { color: theme.colors.textSub }]}>
            基本はローカル保存です。Googleログインしている場合のみ、手動でクラウドにバックアップ/復元できます。
          </Text>

          {/* ✅ 最終日時表示（端末ローカル） */}
          <View style={[styles.cloudMetaBox, { borderColor: theme.colors.borderSoft }]}>
            <Text style={[styles.cloudMetaText, { color: theme.colors.textSub }]}>
              最終バックアップ: {lastBackupAt ? formatJst(lastBackupAt) : '未実行'}
            </Text>
            <Text style={[styles.cloudMetaText, { color: theme.colors.textSub }]}>
              最終復元: {lastRestoreAt ? formatJst(lastRestoreAt) : '未実行'}
            </Text>
          </View>

          {authState.isAnonymous ? (
            <View style={[styles.cloudDisabledBox, { borderColor: theme.colors.borderSoft }]}>
              <Text style={[styles.cloudDisabledText, { color: theme.colors.textSub }]}>
                クラウド機能は Googleログイン後に使えます。
              </Text>
            </View>
          ) : (
            <>
              {/* ===== クラウド操作（すべて同一デザイン） ===== */}

              <TouchableOpacity
                style={[
                  styles.cloudOutlineButton,
                  {
                    borderColor: theme.colors.borderSoft,
                    backgroundColor: theme.colors.surfaceAlt,
                    opacity: cloudBusy ? 0.6 : 1,
                  },
                ]}
                onPress={cloudBusy ? undefined : backupAllToCloud}
                activeOpacity={0.85}
              >
                <Text style={[styles.cloudOutlineButtonText, { color: theme.colors.textMain }]}>
                  {cloudBusy ? '処理中…' : 'ローカル→クラウドにバックアップ（全期間）'}
                </Text>
              </TouchableOpacity>

              <View style={{ height: 10 }} />

              <TouchableOpacity
                style={[
                  styles.cloudOutlineButton,
                  {
                    borderColor: theme.colors.borderSoft,
                    backgroundColor: theme.colors.surfaceAlt,
                    opacity: cloudBusy ? 0.6 : 1,
                  },
                ]}
                onPress={cloudBusy ? undefined : () => restoreFromCloud('preferLocal')}
                activeOpacity={0.85}
              >
                <Text style={[styles.cloudOutlineButtonText, { color: theme.colors.textMain }]}>
                  {cloudBusy ? '処理中…' : 'クラウド→ローカル復元（ローカル優先）'}
                </Text>
              </TouchableOpacity>

              <View style={{ height: 10 }} />

              <TouchableOpacity
                style={[
                  styles.cloudOutlineButton,
                  {
                    borderColor: theme.colors.borderSoft,
                    backgroundColor: theme.colors.surfaceAlt,
                    opacity: cloudBusy ? 0.6 : 1,
                  },
                ]}
                onPress={cloudBusy ? undefined : () => restoreFromCloud('overwrite')}
                activeOpacity={0.85}
              >
                <Text style={[styles.cloudOutlineButtonText, { color: theme.colors.textMain }]}>
                  {cloudBusy ? '処理中…' : 'クラウド→ローカル復元（上書き）'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ===== ニックネーム ===== */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textMain }]}>表示名</Text>

          <Text style={[styles.sectionNote, { color: theme.colors.textSub }]}>
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

          <Text style={[styles.autoSaveNote, { color: theme.colors.textSub }]}>
            入力内容は自動的に保存されます。
          </Text>
        </View>

        {/* ===== 性別・年代 ===== */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, marginTop: 16 }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textMain }]}>任意の情報</Text>
          <Text style={[styles.sectionNote, { color: theme.colors.textSub }]}>
            性別や年代は、個人を特定できない形で統計・機能改善のために使われます。
            公開されたり、第三者に共有されることはありません。
          </Text>

          {/* 性別 */}
          <Text style={[styles.fieldLabel, { color: theme.colors.textMain }]}>性別（任意）</Text>
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.map(opt => {
              const selected = opt.value === gender;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.chip,
                    {
                      borderColor: selected ? theme.colors.primary : theme.colors.borderSoft,
                      backgroundColor: selected ? theme.colors.surfaceAlt : 'transparent',
                    },
                  ]}
                  onPress={() => updateGender(opt.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: selected ? theme.colors.primary : theme.colors.textMain },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 年代 */}
          <Text style={[styles.fieldLabel, { color: theme.colors.textMain }]}>年代（任意）</Text>
          <View style={styles.chipRow}>
            {AGE_OPTIONS.map(opt => {
              const selected = opt.value === ageRange;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.chip,
                    {
                      borderColor: selected ? theme.colors.primary : theme.colors.borderSoft,
                      backgroundColor: selected ? theme.colors.surfaceAlt : 'transparent',
                    },
                  ]}
                  onPress={() => updateAgeRange(opt.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: selected ? theme.colors.primary : theme.colors.textMain },
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
        <View style={[styles.futureCard, { borderColor: theme.colors.borderSoft }]}>
          <Text style={[styles.futureTitle, { color: theme.colors.textMain }]}>
            追加予定の項目
          </Text>
          <Text style={[styles.futureText, { color: theme.colors.textSub }]}>
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

  accountRow: {
    marginTop: 2,
    marginBottom: 10,
  },
  accountStatus: {
    fontSize: 11,
  },
  authButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  authButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authButtonOutline: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  authButtonOutlineText: {
    fontSize: 13,
    fontWeight: '700',
  },

  cloudHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cloudMetaBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  cloudMetaText: {
    fontSize: 11,
    lineHeight: 16,
  },
  cloudDisabledBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  cloudDisabledText: {
    fontSize: 11,
    lineHeight: 16,
  },
  cloudPrimaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  cloudPrimaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cloudOutlineButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cloudOutlineButtonText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  cloudDangerButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cloudDangerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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