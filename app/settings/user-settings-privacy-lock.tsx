// app/settings/user-settings-privacy-lock.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePrivacyLock } from '../../src/privacy/usePrivacyLock';
import { useSubscription } from '../../src/subscription/useSubscription';
import { useTheme } from '../../src/theme/useTheme';

export default function PrivacyLockSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { isPro } = useSubscription();

  const {
    loading,
    enabled,
    hasPin,
    setEnabled,
    setPin,
    clearPin,
    authenticateWithBiometrics,
    validatePin,
  } = usePrivacyLock();

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinConfirmInput, setPinConfirmInput] = useState('');
  const [pinCheckModalVisible, setPinCheckModalVisible] = useState(false);
  const [pinCheckInput, setPinCheckInput] = useState('');

  // Pro じゃない場合のガード
  const requirePro = () => {
    if (!isPro) {
      Alert.alert(
        'SereNote Pro 限定機能',
        'プライバシーロックは SereNote Pro でご利用いただけます。'
      );
      return false;
    }
    return true;
  };

  const toggleLock = async () => {
    if (!requirePro()) return;

    if (!enabled) {
      // ON にするときは一度生体認証を試す
      const ok = await authenticateWithBiometrics();
      if (!ok) {
        Alert.alert(
          '生体認証が利用できません',
          'FaceID / TouchID が使えない場合は、PIN のみでロックすることもできます。'
        );
      }
      await setEnabled(true);
    } else {
      await setEnabled(false);
    }
  };

  const savePin = async () => {
    if (!requirePro()) return;

    if (pinInput.length < 4) {
      Alert.alert('エラー', 'PIN は4桁以上にしてください。');
      return;
    }
    if (pinInput !== pinConfirmInput) {
      Alert.alert('エラー', 'PIN が一致しません。');
      return;
    }
    await setPin(pinInput);
    setPinModalVisible(false);
    Alert.alert('保存しました', 'PIN が設定されました。');
  };

  const testLock = async () => {
    if (!requirePro()) return;

    const ok = await authenticateWithBiometrics();
    if (ok) {
      Alert.alert('成功', 'FaceID / TouchID でロック解除できました。');
      return;
    }
    // 生体認証が使えない → PIN があるなら PIN でテスト
    if (hasPin) {
      setPinCheckInput('');
      setPinCheckModalVisible(true);
    } else {
      Alert.alert(
        '認証できません',
        'PIN が設定されていません。「PIN を設定する」から登録してください。'
      );
    }
  };

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
            プライバシーロック設定を読み込み中…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const proDisabled = !isPro;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* タイトル */}
        <Text
          style={[
            styles.title,
            { color: theme.colors.textMain },
          ]}
        >
          プライバシーロック
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.colors.textSub },
          ]}
        >
          アプリ起動時に FaceID / TouchID または PIN で保護できます。
        </Text>

        {proDisabled && (
          <View
            style={[
              styles.proBanner,
              { backgroundColor: theme.colors.surfaceAlt },
            ]}
          >
            <Text
              style={[
                styles.proBannerTitle,
                { color: theme.colors.textMain },
              ]}
            >
              SereNote Pro 限定機能
            </Text>
            <Text
              style={[
                styles.proBannerText,
                { color: theme.colors.textSub },
              ]}
            >
              プライバシーロックは Pro プランでご利用いただけます。
              {'\n'}
              現在はお試し用の UI だけ有効になっています。
            </Text>
          </View>
        )}

        {/* 起動時ロック ON/OFF */}
        <TouchableOpacity
          style={[
            styles.row,
            { backgroundColor: theme.colors.card },
          ]}
          onPress={toggleLock}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.rowTitle,
                { color: theme.colors.textMain },
              ]}
            >
              起動時にロックをかける
            </Text>
            <Text
              style={[
                styles.rowSub,
                { color: theme.colors.textSub },
              ]}
            >
              アプリを開くたびに FaceID / TouchID（または PIN）で解除します。
            </Text>
          </View>
          <Text
            style={{
              color: enabled
                ? theme.colors.primary
                : theme.colors.textSub,
              fontWeight: '600',
            }}
          >
            {enabled ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>

        {/* PIN 設定 / 変更 */}
        <TouchableOpacity
          style={[
            styles.row,
            { backgroundColor: theme.colors.card },
          ]}
          onPress={() => {
            if (!requirePro()) return;
            setPinInput('');
            setPinConfirmInput('');
            setPinModalVisible(true);
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.rowTitle,
                { color: theme.colors.textMain },
              ]}
            >
              {hasPin ? 'PIN を変更する' : 'PIN を設定する'}
            </Text>
            <Text
              style={[
                styles.rowSub,
                { color: theme.colors.textSub },
              ]}
            >
              生体認証が使えない端末でも PIN でロック解除できるようにします。
            </Text>
          </View>
          <Text style={{ color: theme.colors.textSub }}>›</Text>
        </TouchableOpacity>

        {/* 動作テスト */}
        <TouchableOpacity
          style={[
            styles.row,
            { backgroundColor: theme.colors.card },
          ]}
          onPress={testLock}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.rowTitle,
                { color: theme.colors.textMain },
              ]}
            >
              ロック動作をテスト
            </Text>
            <Text
              style={[
                styles.rowSub,
                { color: theme.colors.textSub },
              ]}
            >
              現在の設定でロック解除が正常にできるか確認します。
            </Text>
          </View>
          <Text style={{ color: theme.colors.textSub }}>›</Text>
        </TouchableOpacity>

        {/* PIN 削除リンク */}
        {hasPin && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'PIN を削除しますか？',
                '削除すると、PIN でのロック解除はできなくなります。',
                [
                  { text: 'キャンセル', style: 'cancel' },
                  {
                    text: '削除する',
                    style: 'destructive',
                    onPress: clearPin,
                  },
                ]
              )
            }
          >
            <Text
              style={{
                marginTop: 14,
                fontSize: 12,
                textDecorationLine: 'underline',
                color: theme.colors.textSub,
              }}
            >
              登録済みの PIN を削除する
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* PIN 設定モーダル */}
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
              PIN を設定
            </Text>
            <Text
              style={[
                styles.modalDesc,
                { color: theme.colors.textSub },
              ]}
            >
              4桁以上の数字を入力してください。
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
              value={pinConfirmInput}
              onChangeText={setPinConfirmInput}
              placeholder="PIN（確認）"
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
                onPress={savePin}
              >
                <Text style={{ color: '#fff' }}>保存する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PIN チェックモーダル（テスト用） */}
      <Modal
        visible={pinCheckModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPinCheckModalVisible(false)}
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
              value={pinCheckInput}
              onChangeText={setPinCheckInput}
              placeholder="PIN"
              placeholderTextColor={theme.colors.textSub}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setPinCheckModalVisible(false)}
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
                onPress={() => {
                  if (validatePin(pinCheckInput)) {
                    Alert.alert('成功', 'PIN が正しく入力されました。');
                    setPinCheckModalVisible(false);
                  } else {
                    Alert.alert('エラー', 'PIN が違います。');
                  }
                }}
              >
                <Text style={{ color: '#fff' }}>確認する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --------------------------
// styles
// --------------------------
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
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  proBanner: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  proBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  proBannerText: {
    fontSize: 11,
    lineHeight: 16,
  },
  row: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 11,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    borderRadius: 16,
    padding: 16,
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