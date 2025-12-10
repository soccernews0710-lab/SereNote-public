// app/settings/user-settings-subscription.tsx
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

import { useSubscription } from '../../src/subscription/useSubscription';
import { useTheme } from '../../src/theme/useTheme';

export default function SubscriptionSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { plan, isPro, setPlan } = useSubscription();

  const [inviteCode, setInviteCode] = useState('');

  const currentPlanLabel = isPro ? '👑 SereNote Pro' : 'Free（無料プラン）';
  const currentPlanDesc = isPro
    ? 'Pro 機能（行動×気分の分析カード など）が有効です。今後、プライバシーロックや追加の統計機能も順次ひらいていく予定です。'
    : '基本的な記録機能はすべて無料で使えます。Pro にアップグレードすると「行動×気分の分析カード」など、より詳しく自分の傾向を振り返る機能が使えるようになります。';

  const handleActivateProWithCode = () => {
    const trimmed = inviteCode.trim();
    if (!trimmed) {
      Alert.alert(
        '招待コードを入力してください',
        '空の招待コードでは Pro を有効にできません。'
      );
      return;
    }

    // ★ 現時点では「何か文字が入っていれば Pro にする」開発用の実装
    // 将来ここに「正しいコードかどうかの判定 / サーバー検証」を追加する想定。
    setPlan('pro');
    Alert.alert(
      'SereNote Pro を有効にしました',
      'アプリ再起動後も Pro 状態が維持されます。'
    );
  };

  const handleSwitchToFree = () => {
    if (!isPro) return;
    Alert.alert(
      'Free プランに戻しますか？',
      'Pro 機能（行動×気分カードや、今後追加される機能）は使えなくなりますが、記録データはそのまま残ります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'Free に戻す',
          style: 'destructive',
          onPress: () => {
            setPlan('free');
            Alert.alert(
              'Free プランに戻しました',
              'いつでも再度 Pro にアップグレードできます。'
            );
          },
        },
      ]
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
        {/* タイトル */}
        <Text
          style={[
            styles.title,
            { color: theme.colors.textMain },
          ]}
        >
          サブスクリプション（SereNote Pro）
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.colors.textSub },
          ]}
        >
          現在のプランを確認したり、SereNote Pro への切り替えを行えます。
          将来的にはここが App Store 課金画面と連動する予定です。
          {/* 医療免責も軽く */}
        </Text>

        {/* 現在のプランカード */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text
            style={[
              styles.cardLabel,
              { color: theme.colors.textSub },
            ]}
          >
            現在のプラン
          </Text>
          <Text
            style={[
              styles.cardPlan,
              { color: theme.colors.textMain },
            ]}
          >
            {currentPlanLabel}
          </Text>
          <Text
            style={[
              styles.cardDesc,
              { color: theme.colors.textSub },
            ]}
          >
            {currentPlanDesc}
          </Text>
        </View>

        {/* Pro 機能のざっくり説明 */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text
            style={[
              styles.cardLabel,
              { color: theme.colors.textSub },
            ]}
          >
            SereNote Pro でできること
          </Text>
          <View style={styles.bulletList}>
            <Text
              style={[
                styles.bulletItem,
                { color: theme.colors.textMain },
              ]}
            >
              ・行動 × 気分の分析カード
            </Text>
            <Text
              style={[
                styles.bulletItemSub,
                { color: theme.colors.textSub },
              ]}
            >
              {'　'}└ 行動時間が多い日 / 少ない日の平均気分を自動で比較し、
              「どんな日が楽に過ごせたか」の傾向を表示します。
            </Text>

            <Text
              style={[
                styles.bulletItem,
                { color: theme.colors.textMain },
              ]}
            >
              ・プライバシーロック（FaceID / PIN）※追加予定
            </Text>
            <Text
              style={[
                styles.bulletItem,
                { color: theme.colors.textMain },
              ]}
            >
              ・期間比較や「ゆらぎの大きい日」だけを振り返るビュー ※追加予定
            </Text>
            <Text
              style={[
                styles.bulletItem,
                { color: theme.colors.textMain },
              ]}
            >
              ・診察用レポート（直近の気分・睡眠と症状の要約）※追加予定
            </Text>
            <Text
              style={[
                styles.bulletItem,
                { color: theme.colors.textMain },
              ]}
            >
              ・全データのエクスポート（CSV / JSON）※仕様検討中
            </Text>
          </View>
        </View>

        {/* 招待コード → Pro 有効化（開発用） */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text
            style={[
              styles.cardLabel,
              { color: theme.colors.textSub },
            ]}
          >
            招待コードで Pro を有効化（開発用）
          </Text>
          <Text
            style={[
              styles.cardDesc,
              { color: theme.colors.textSub },
            ]}
          >
            本番課金の前段階として、招待コード経由で Pro を ON にするための土台です。
            いまは「何か文字を入れてボタンを押すと Pro になる」デバッグ仕様です。
            実際にリリースする際は、ここに App Store 経由の課金処理を組み込む想定です。
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.colors.borderSoft,
                color: theme.colors.textMain,
              },
            ]}
            placeholder="例：SERENOTE-PRO-2025"
            placeholderTextColor={theme.colors.textSub}
            value={inviteCode}
            onChangeText={setInviteCode}
          />

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleActivateProWithCode}
          >
            <Text style={styles.primaryButtonText}>
              招待コードで Pro を有効にする
            </Text>
          </TouchableOpacity>
        </View>

        {/* Free に戻す */}
        {isPro && (
          <View style={styles.footerBox}>
            <TouchableOpacity onPress={handleSwitchToFree}>
              <Text
                style={[
                  styles.backToFreeText,
                  { color: theme.colors.textSub },
                ]}
              >
                Free プランに戻す
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ----------------------
// styles
// ----------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
    marginBottom: 16,
  },
  card: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardPlan: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  bulletList: {
    marginTop: 4,
  },
  bulletItem: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  bulletItemSub: {
    fontSize: 11,
    lineHeight: 17,
    marginLeft: 4,
  },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 10,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footerBox: {
    marginTop: 8,
    alignItems: 'center',
  },
  backToFreeText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});