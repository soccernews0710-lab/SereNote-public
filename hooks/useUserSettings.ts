// hooks/useUserSettings.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

// プロジェクトのパスに合わせて調整
import { auth, db } from '../src/firebase';

/** 性別の型 */
export type Gender =
  | 'male'
  | 'female'
  | 'non_binary'
  | 'prefer_not_to_say'
  | 'other';

/** 年代の型 */
export type AgeRange =
  | 'none'
  | 'under_18'
  | '18_24'
  | '25_34'
  | '35_44'
  | '45_54'
  | '55_plus';

/** ユーザー設定全体 */
export type UserSettings = {
  nickname: string | null;
  gender: Gender;
  ageRange: AgeRange;
  /** プロフィール画像（Firebase Storage のダウンロードURL） */
  profileImageUri: string | null;
};

const STORAGE_KEY = 'SERENOTE_USER_SETTINGS_V1';
const FIRESTORE_COLLECTION = 'userSettings';

const defaultSettings: UserSettings = {
  nickname: null,
  gender: 'prefer_not_to_say',
  ageRange: 'none',
  profileImageUri: null,
};

// 型ガード用のリスト
const GENDER_VALUES: Gender[] = [
  'male',
  'female',
  'non_binary',
  'prefer_not_to_say',
  'other',
];

const AGE_RANGE_VALUES: AgeRange[] = [
  'none',
  'under_18',
  '18_24',
  '25_34',
  '35_44',
  '45_54',
  '55_plus',
];

function isValidGender(value: unknown): value is Gender {
  return typeof value === 'string' && GENDER_VALUES.includes(value as Gender);
}

function isValidAgeRange(value: unknown): value is AgeRange {
  return typeof value === 'string' && AGE_RANGE_VALUES.includes(value as AgeRange);
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  // ===== 初回ロード（AsyncStorage → Firestore の順でマージ） =====
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // ① ローカル（AsyncStorage）
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        let localSettings: UserSettings;

        if (!json) {
          localSettings = defaultSettings;
        } else {
          try {
            const parsed = JSON.parse(json) as Partial<UserSettings>;
            localSettings = {
              nickname:
                typeof parsed.nickname === 'string'
                  ? parsed.nickname
                  : defaultSettings.nickname,
              gender: isValidGender(parsed.gender)
                ? parsed.gender
                : defaultSettings.gender,
              ageRange: isValidAgeRange(parsed.ageRange)
                ? parsed.ageRange
                : defaultSettings.ageRange,
              profileImageUri:
                typeof parsed.profileImageUri === 'string'
                  ? parsed.profileImageUri
                  : defaultSettings.profileImageUri,
            };
          } catch (e) {
            console.warn('Failed to parse user settings, resetting.', e);
            localSettings = defaultSettings;
          }
        }

        if (cancelled) return;
        setSettings(localSettings);

        // ② Firestore と同期（Auth ユーザーがいる場合）
        const user = auth.currentUser;
        if (user) {
          try {
            const ref = doc(db, FIRESTORE_COLLECTION, user.uid);
            const snap = await getDoc(ref);
            if (cancelled) return;

            if (snap.exists()) {
              const data = snap.data() as Partial<UserSettings>;
              const remoteSettings: UserSettings = {
                nickname:
                  typeof data.nickname === 'string'
                    ? data.nickname
                    : localSettings.nickname,
                gender: isValidGender(data.gender)
                  ? data.gender
                  : localSettings.gender,
                ageRange: isValidAgeRange(data.ageRange)
                  ? data.ageRange
                  : localSettings.ageRange,
                profileImageUri:
                  typeof data.profileImageUri === 'string'
                    ? data.profileImageUri
                    : localSettings.profileImageUri,
              };

              // リモートを優先してマージ
              setSettings(remoteSettings);
              await AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(remoteSettings)
              );
            } else {
              // Firestore にまだ何もない → ローカル値を書き込む
              await setDoc(ref, {
                ...localSettings,
                updatedAt: Date.now(),
              });
            }
          } catch (e) {
            console.warn('Failed to sync user settings with Firestore', e);
          }
        }
      } catch (e) {
        console.warn('Failed to load user settings', e);
        setSettings(defaultSettings);
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ===== 保存（AsyncStorage + Firestore） =====
  const saveSettings = useCallback(async (next: UserSettings) => {
    setSettings(next);

    // AsyncStorage
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to save user settings (AsyncStorage)', e);
    }

    // Firestore（ログイン済みなら）
    const user = auth.currentUser;
    if (user) {
      try {
        const ref = doc(db, FIRESTORE_COLLECTION, user.uid);
        await setDoc(
          ref,
          {
            ...next,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Failed to save user settings (Firestore)', e);
      }
    }
  }, []);

  // 一部だけ更新したいとき用
  const updateSettings = useCallback(
    async (partial: Partial<UserSettings>) => {
      const next: UserSettings = {
        ...settings,
        ...partial,
      };
      await saveSettings(next);
    },
    [settings, saveSettings]
  );

  // ===== ショートカット群 =====

  const updateNickname = useCallback(
    async (nickname: string) => {
      await updateSettings({ nickname: nickname.trim() || null });
    },
    [updateSettings]
  );

  const updateGender = useCallback(
    async (gender: Gender) => {
      await updateSettings({ gender });
    },
    [updateSettings]
  );

  const updateAgeRange = useCallback(
    async (ageRange: AgeRange) => {
      await updateSettings({ ageRange });
    },
    [updateSettings]
  );

  const updateProfileImageUri = useCallback(
    async (uri: string | null) => {
      await updateSettings({ profileImageUri: uri });
    },
    [updateSettings]
  );

  // ===== hook の戻り値 =====
  return {
    loaded,
    settings,
    nickname: settings.nickname,
    gender: settings.gender,
    ageRange: settings.ageRange,
    profileImageUri: settings.profileImageUri,
    updateNickname,
    updateGender,
    updateAgeRange,
    updateProfileImageUri,
    updateSettings,
  };
}