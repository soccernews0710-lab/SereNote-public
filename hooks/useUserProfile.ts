// hooks/useUserProfile.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'serenote_user_profile_v1';

type UserProfile = {
  nickname: string;
};

export function useUserProfile() {
  const [loaded, setLoaded] = useState(false);
  const [nickname, setNicknameState] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;

        if (raw) {
          const obj = JSON.parse(raw) as UserProfile;
          setNicknameState(obj.nickname ?? '');
        }
      } catch (e) {
        console.warn('Failed to load user profile', e);
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

  const setNickname = async (value: string) => {
    const trimmed = value.trim();
    setNicknameState(trimmed);

    const profile: UserProfile = {
      nickname: trimmed,
    };

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save user profile', e);
    }
  };

  return {
    loaded,
    nickname,
    setNickname,
  };
}