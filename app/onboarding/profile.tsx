// app/onboarding/profile.tsx
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
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

import { useUserSettings } from '../../hooks/useUserSettings';
import { useTheme } from '../../src/theme/useTheme';

function isMissingNickname(v: string | null | undefined) {
  return !v || v.trim().length === 0;
}

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const { loaded, nickname, updateNickname } = useUserSettings();

  // TextInput は「即保存」だと打ちづらいことがあるので、入力中は local state 推奨
  const [localName, setLocalName] = useState<string>(nickname ?? '');
  const [busy, setBusy] = useState(false);

  const canContinue = useMemo(() => !isMissingNickname(localName), [localName]);

  const handleContinue = useCallback(async () => {
    // 未入力なら優しくガード
    if (isMissingNickname(localName)) {
      Alert.alert(
        '表示名が未設定です',
        'この画面で必須なのは「表示名」だけです。\n仮の名前でもOKなので、何か入れてから進んでください。',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setBusy(true);

      // ✅ 保存（hook側で local + cloud 連動）
      await updateNickname(localName);

      // ✅ メインへ
      router.replace('/(tabs)' as any);
    } finally {
      setBusy(false);
    }
  }, [localName, updateNickname, router]);

  // ✅ “スキップ”は残すなら「必須」矛盾になるので、ここでは「仮名を自動入力」方式にする
  // ※どうしても “完全スキップ” にしたいなら、OnboardingGate の mustOnboard 条件を変える必要がある
  const handleSkip = useCallback(async () => {
    const ok = await new Promise<boolean>(resolve => {
      Alert.alert(
        '今はスキップしますか？',
        '表示名は必須ですが、仮の名前でも問題ありません。\n自動で「Guest」にして進みます（後から変更OK）。',
        [
          { text: '戻る', style: 'cancel', onPress: () => resolve(false) },
          { text: '進む', style: 'default', onPress: () => resolve(true) },
        ]
      );
    });

    if (!ok) return;

    try {
      setBusy(true);

      // ✅ 仮の表示名を自動設定して通す（必須要件を崩さない）
      const fallback = (localName?.trim()?.length ? localName : 'Guest').trim();
      await updateNickname(fallback);

      router.replace('/(tabs)' as any);
    } finally {
      setBusy(false);
    }
  }, [localName, updateNickname, router]);

  if (!loaded) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* ===== 導入 ===== */}
        <Text style={[styles.kicker, { color: theme.colors.textSub }]}>
          はじめに、少しだけ。
        </Text>

        <Text style={[styles.title, { color: theme.colors.textMain }]}>
          SereNote は、気持ちや体調を{'\n'}そのまま残しておけるノートです。
        </Text>

        <Text style={[styles.lead, { color: theme.colors.textSub }]}>
          まずは最低限の設定だけ、{'\n'}一緒に整えていきましょう。
        </Text>

        {/* ✅ NickNameだけMust */}
        <Text style={[styles.smallNote, { color: theme.colors.textSub }]}>
          ※ この画面で必須なのは「表示名」だけです。{'\n'}
          それ以外の設定は、あとからいつでも変更できます。
        </Text>

        {/* ===== 表示名 ===== */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textMain }]}>
            あなたの呼び名{' '}
            <Text style={{ color: theme.colors.primary }}>（必須）</Text>
          </Text>

          <Text style={[styles.sectionNote, { color: theme.colors.textSub }]}>
            SereNote の中で使う名前です。{'\n'}本名でなくても大丈夫です。
          </Text>

          <TextInput
            value={localName}
            onChangeText={setLocalName}
            placeholder="例：まさたか / Masa"
            placeholderTextColor={theme.colors.textSub}
            style={[
              styles.input,
              {
                borderColor: theme.colors.borderSoft,
                backgroundColor: theme.colors.surfaceAlt,
                color: theme.colors.textMain,
              },
            ]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            editable={!busy}
          />

          <Text style={[styles.smallHint, { color: theme.colors.textSub }]}>
            ※ 仮の名前でもOKです。あとから設定画面でいつでも変更できます。
          </Text>
        </View>

        {/* ===== ボタン ===== */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: busy ? 0.6 : 1,
            },
          ]}
          onPress={busy ? undefined : handleContinue}
          activeOpacity={0.85}
          disabled={!canContinue || busy}
        >
          <Text style={styles.primaryButtonText}>
            {busy ? '処理中…' : 'このまま進む'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.outlineButton,
            {
              borderColor: theme.colors.borderSoft,
              backgroundColor: theme.colors.surfaceAlt,
              opacity: busy ? 0.6 : 1,
            },
          ]}
          onPress={busy ? undefined : handleSkip}
          activeOpacity={0.85}
          disabled={busy}
        >
          <Text style={[styles.outlineButtonText, { color: theme.colors.textMain }]}>
            今はスキップ（仮名で進む）
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 16, paddingBottom: 28 },

  kicker: { fontSize: 12, marginBottom: 6, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '800', lineHeight: 24, marginBottom: 10 },
  lead: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  smallNote: { fontSize: 11, lineHeight: 16, marginBottom: 14 },

  card: {
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 14,
  },

  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  sectionNote: { fontSize: 11, lineHeight: 16, marginBottom: 10 },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },

  smallHint: { marginTop: 8, fontSize: 11 },

  primaryButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  outlineButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  outlineButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});