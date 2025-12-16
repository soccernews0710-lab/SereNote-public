// hooks/useUserSettings.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';

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

  /** メタ（任意） */
  updatedAt?: any;
  createdAt?: any;
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

function normalizeSettings(
  raw: Partial<UserSettings> | null | undefined,
  fallback: UserSettings
): UserSettings {
  const data = raw ?? {};
  return {
    nickname:
      typeof data.nickname === 'string' ? data.nickname : fallback.nickname,
    gender: isValidGender(data.gender) ? data.gender : fallback.gender,
    ageRange: isValidAgeRange(data.ageRange) ? data.ageRange : fallback.ageRange,
    profileImageUri:
      typeof data.profileImageUri === 'string'
        ? data.profileImageUri
        : fallback.profileImageUri,
    // meta（あってもなくてもOK）
    updatedAt: (data as any).updatedAt ?? fallback.updatedAt,
    createdAt: (data as any).createdAt ?? fallback.createdAt,
  };
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  // 連打で同期が競合しないように
  const syncingRef = useRef(false);
  const localLoadedRef = useRef(false);

  // ===== ① 初回ロード：まずローカルを読む（必ず起動で動く） =====
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);

        let localSettings: UserSettings = defaultSettings;
        if (json) {
          try {
            const parsed = JSON.parse(json) as Partial<UserSettings>;
            localSettings = normalizeSettings(parsed, defaultSettings);
          } catch (e) {
            console.warn('Failed to parse user settings, resetting.', e);
            localSettings = defaultSettings;
          }
        }

        if (cancelled) return;
        setSettings(localSettings);
      } catch (e) {
        console.warn('Failed to load user settings', e);
        if (!cancelled) setSettings(defaultSettings);
      } finally {
        if (!cancelled) {
          localLoadedRef.current = true;
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ===== ② Auth確定後に Firestore 同期（ここが重要） =====
  useEffect(() => {
    let cancelled = false;

    const syncFromFirestore = async (user: User) => {
      if (syncingRef.current) return;
      syncingRef.current = true;

      try {
        // ローカルがまだ読めてないなら待つ（念のため）
        if (!localLoadedRef.current) return;

        const ref = doc(db, FIRESTORE_COLLECTION, user.uid);
        const snap = await getDoc(ref);

        if (cancelled) return;

        if (snap.exists()) {
          const data = snap.data() as DocumentData;

          // リモート優先でマージ（シンプル運用）
          const remoteSettings = normalizeSettings(data as Partial<UserSettings>, settings);

          setSettings(remoteSettings);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remoteSettings));
        } else {
          // Firestoreにまだ無い → ローカルを書き込んで初期化
          await setDoc(
            ref,
            {
              ...settings,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (e) {
        console.warn('Failed to sync user settings with Firestore', e);
      } finally {
        syncingRef.current = false;
      }
    };

    const unsub = onAuthStateChanged(auth, user => {
      if (user) {
        syncFromFirestore(user);
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
    // settings を依存に入れると同期がループしやすいので入れない
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            nickname: next.nickname,
            gender: next.gender,
            ageRange: next.ageRange,
            profileImageUri: next.profileImageUri,
            updatedAt: serverTimestamp(),
            // 無ければ作る（既にあれば維持）
            createdAt: serverTimestamp(),
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