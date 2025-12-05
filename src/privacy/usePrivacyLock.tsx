// src/privacy/usePrivacyLock.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

const STORAGE_ENABLED_KEY = 'serenote_privacy_enabled_v1';
const STORAGE_PIN_KEY = 'serenote_privacy_pin_v1';

type PrivacyLockContextValue = {
  loading: boolean;
  enabled: boolean;
  hasPin: boolean;

  // 設定を変える系
  setEnabled: (value: boolean) => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  clearPin: () => Promise<void>;

  // 認証まわり
  authenticateWithBiometrics: () => Promise<boolean>;
  validatePin: (pin: string) => boolean;
};

const PrivacyLockContext = createContext<PrivacyLockContextValue | null>(null);

export const PrivacyLockProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(true);

  const [enabled, setEnabledState] = useState<boolean>(false);
  const [pin, setPinState] = useState<string | null>(null);

  // ===== 起動時に設定を読み込み =====
  useEffect(() => {
    (async () => {
      try {
        const [enabledStr, pinStr] = await AsyncStorage.multiGet([
          STORAGE_ENABLED_KEY,
          STORAGE_PIN_KEY,
        ]);

        // enabled
        if (enabledStr?.[1] != null) {
          // 'true' / 'false' をそのまま使う
          setEnabledState(enabledStr[1] === 'true');
        } else {
          setEnabledState(false);
        }

        // pin
        if (pinStr?.[1]) {
          setPinState(pinStr[1]);
        } else {
          setPinState(null);
        }
      } catch (e) {
        console.warn('Failed to load privacy lock settings', e);
        setEnabledState(false);
        setPinState(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ===== enabled を保存 =====
  const setEnabled = async (value: boolean) => {
    setEnabledState(value);
    try {
      // 常に 'true' or 'false' を書く（remove ではなく上書き）
      await AsyncStorage.setItem(STORAGE_ENABLED_KEY, value ? 'true' : 'false');
    } catch (e) {
      console.warn('Failed to save enabled flag', e);
    }
  };

  // ===== PIN を保存 =====
  const setPin = async (newPin: string) => {
    setPinState(newPin);
    try {
      await AsyncStorage.setItem(STORAGE_PIN_KEY, newPin);
    } catch (e) {
      console.warn('Failed to save PIN', e);
    }
  };

  // ===== PIN を削除 =====
  const clearPin = async () => {
    setPinState(null);
    try {
      await AsyncStorage.removeItem(STORAGE_PIN_KEY);
    } catch (e) {
      console.warn('Failed to clear PIN', e);
    }
  };

  // ===== 生体認証 =====
  const authenticateWithBiometrics = async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return false;

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (!types || types.length === 0) return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'SereNote を解除',
        cancelLabel: 'キャンセル',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (e) {
      console.warn('Biometric auth failed', e);
      return false;
    }
  };

  // ===== PIN 検証 =====
  const validatePin = (input: string): boolean => {
    if (!pin) return false;
    return input === pin;
  };

  const value: PrivacyLockContextValue = {
    loading,
    enabled,
    hasPin: !!pin,
    setEnabled,
    setPin,
    clearPin,
    authenticateWithBiometrics,
    validatePin,
  };

  return (
    <PrivacyLockContext.Provider value={value}>
      {children}
    </PrivacyLockContext.Provider>
  );
};

export function usePrivacyLock() {
  const ctx = useContext(PrivacyLockContext);
  if (!ctx) {
    throw new Error('usePrivacyLock must be used within PrivacyLockProvider');
  }
  return ctx;
}