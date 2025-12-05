// src/privacy/AppGate.tsx
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useTheme } from '../theme/useTheme';
import { usePrivacyLock } from './usePrivacyLock';

type Props = {
  children: React.ReactNode;
};

/**
 * アプリ全体をラップして、
 * - プライバシーロックの設定を読み込み
 * - enabled === true なら起動時にロック画面を挟む
 */
export const AppGate: React.FC<Props> = ({ children }) => {
  const { theme } = useTheme();
  const {
    loading,
    enabled,
    hasPin,
    authenticateWithBiometrics,
    validatePin,
  } = usePrivacyLock();

  // このセッションで解除済みかどうか
  const [unlocked, setUnlocked] = useState(false);

  // PIN 入力モーダル
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // enabled が OFF なら常に解放状態にする
  useEffect(() => {
    if (!enabled) {
      setUnlocked(true);
    } else {
      setUnlocked(false);
    }
  }, [enabled]);

  // 起動時に 1 回だけ生体認証を試す（失敗してもアラートは出さない）
  useEffect(() => {
    if (loading) return;
    if (!enabled) return;
    if (unlocked) return;

    (async () => {
      const ok = await authenticateWithBiometrics();
      if (ok) {
        setUnlocked(true);
      }
      // 失敗時は何もせず、画面上のボタンから再トライできるようにする
    })();
  }, [loading, enabled, unlocked, authenticateWithBiometrics]);

  // ロード中（設定読み込み中）
  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: theme.colors.textSub },
            ]}
          >
            設定を読み込み中…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ロックが無効、または解除済み → 普通にアプリを表示
  if (!enabled || unlocked) {
    return <>{children}</>;
  }

  // ここから下は「ロック画面」
  const handleBiometricPress = async () => {
    const ok = await authenticateWithBiometrics();
    if (ok) {
      setUnlocked(true);
    } else {
      Alert.alert(
        'ロック解除できません',
        'Face ID / Touch ID が利用できないか、キャンセルされました。'
      );
    }
  };

  const handlePinSubmit = () => {
    if (validatePin(pinInput)) {
      setPinInput('');
      setPinModalVisible(false);
      setUnlocked(true);
    } else {
      Alert.alert('エラー', 'PIN が違います。');
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.lockContainer}>
        <View
          style={[
            styles.lockCard,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.lockIcon, { color: theme.colors.primary }]}>
            🔒
          </Text>
          <Text
            style={[
              styles.lockTitle,
              { color: theme.colors.textMain },
            ]}
          >
            プライバシーロック
          </Text>
          <Text
            style={[
              styles.lockSubtitle,
              { color: theme.colors.textSub },
            ]}
          >
            アプリを開くには、FaceID / TouchID または PIN で解除してください。
          </Text>

          <TouchableOpacity
            style={[
              styles.lockButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleBiometricPress}
          >
            <Text style={styles.lockButtonText}>
              Face ID / Touch ID で解除
            </Text>
          </TouchableOpacity>

          {hasPin && (
            <TouchableOpacity
              style={[
                styles.lockButtonSecondary,
                { borderColor: theme.colors.borderSoft },
              ]}
              onPress={() => {
                setPinInput('');
                setPinModalVisible(true);
              }}
            >
              <Text
                style={[
                  styles.lockButtonSecondaryText,
                  { color: theme.colors.textMain },
                ]}
              >
                PIN で解除
              </Text>
            </TouchableOpacity>
          )}

          {!hasPin && (
            <Text
              style={[
                styles.lockHint,
                { color: theme.colors.textSub },
              ]}
            >
              PIN を使いたい場合は、
              {'\n'}
              「設定 → ユーザー設定 → プライバシーロック」から PIN を登録できます。
            </Text>
          )}
        </View>
      </View>

      {/* PIN 入力モーダル */}
      <Modal
        visible={pinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modal,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: theme.colors.textMain },
              ]}
            >
              PIN を入力
            </Text>
            <Text
              style={[
                styles.modalDesc,
                { color: theme.colors.textSub },
              ]}
            >
              登録済みの PIN を入力してください。
            </Text>

            <TextInput
              style={[
                styles.pinInput,
                {
                  borderColor: theme.colors.borderSoft,
                  color: theme.colors.textMain,
                },
              ]}
              secureTextEntry
              keyboardType="numeric"
              value={pinInput}
              onChangeText={setPinInput}
              placeholder="PIN"
              placeholderTextColor={theme.colors.textSub}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setPinModalVisible(false)}
              >
                <Text style={{ color: theme.colors.textSub }}>
                  キャンセル
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSave,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handlePinSubmit}
              >
                <Text style={{ color: '#fff' }}>解除する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
  },

  lockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  lockCard: {
    width: '100%',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lockIcon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  lockTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  lockSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  lockButton: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  lockButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lockButtonSecondary: {
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
  },
  lockButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  lockHint: {
    marginTop: 10,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 12,
    marginBottom: 10,
  },
  pinInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  modalCancel: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalSave: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
});