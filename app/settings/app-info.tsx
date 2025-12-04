// app/settings/app-info.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TermsOfUseContent from '../../components/settings/TermsOfUseContent';
import { useTheme } from '../../src/theme/useTheme';

export default function AppInfoScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* ヘッダー */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text
              style={[
                styles.backText,
                { color: theme.colors.primary },
              ]}
            >
              ‹ 戻る
            </Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.colors.textMain },
            ]}
          >
            アプリ情報
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <Text
          style={[
            styles.appName,
            { color: theme.colors.textMain },
          ]}
        >
          SereNote
        </Text>
        <Text
          style={[
            styles.appMeta,
            { color: theme.colors.textSub },
          ]}
        >
          Version 1.0
        </Text>

        {/* 利用規約 */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.textMain },
          ]}
        >
          利用規約
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <TermsOfUseContent />
        </View>

        {/* プライバシーポリシー */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.textMain },
          ]}
        >
          プライバシーポリシー
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            SereNote は、ユーザーが入力した記録データ（睡眠・気分・症状・お薬・メモなど）を
            すべて端末ローカルに保存し、サーバーへ送信しません。
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            当事業者が取得する可能性のある情報は、ユーザーからの問い合わせ時に送信される
            メールアドレスや内容に限られます。これらはサポート対応のためにのみ利用し、
            一定期間経過後に削除します。
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            将来的に広告やサブスクリプション機能を導入する場合は、このポリシーを更新し、
            アプリ内で明示的にお知らせします。
          </Text>
        </View>

        {/* データの扱いについて */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.textMain },
          ]}
        >
          データの扱いについて
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            ・記録データ（睡眠・気分・症状・お薬・メモなど）は、すべて端末内にのみ保存されます。
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            ・当事業者は、ユーザーの健康データや記録内容をサーバーに保存・解析・共有しません。
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            ・必要に応じて、ユーザーご自身でバックアップ（スクリーンショットや将来のエクスポート機能など）を行ってください。
          </Text>
        </View>

        {/* 通知について */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.textMain },
          ]}
        >
          通知について
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            SereNote では、服薬リマインドなどの通知を利用することがあります（今後追加予定）。
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            通知の許可は任意であり、端末の設定からいつでもオン・オフを切り替えることができます。
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            通知の設定に関する情報は端末内で管理され、サーバーには送信されません。
          </Text>
        </View>

        {/* 簡単な使い方（ユーザーガイド） */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.textMain },
          ]}
        >
          簡単な使い方（ユーザーガイド）
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text
            style={[
              styles.guideTitle,
              { color: theme.colors.textMain },
            ]}
          >
            Today（今日）タブ
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            ・起床・就寝・気分・お薬・行動・症状・メモを、その都度タイムラインに記録できます。
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            ・上部の「今日のまとめ」で、その日の睡眠や気分などをざっくり確認できます。
          </Text>

          <Text
            style={[
              styles.guideTitle,
              { color: theme.colors.textMain },
            ]}
          >
            History（履歴）タブ
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            ・過去の日付ごとの記録を一覧で確認できます。
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            ・タップすると、その日のタイムライン詳細が開きます。
          </Text>

          <Text
            style={[
              styles.guideTitle,
              { color: theme.colors.textMain },
            ]}
          >
            Stats（統計）タブ
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            ・直近7日 / 14日 / 30日を切り替えて、気分・睡眠・服薬状況・メモ/症状の量を振り返れます。
          </Text>

          <Text
            style={[
              styles.guideTitle,
              { color: theme.colors.textMain },
            ]}
          >
            Settings（設定）タブ
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            ・ニックネームやお薬・リマインド時刻の設定、アプリ情報の確認ができます。
          </Text>
        </View>

        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { color: theme.colors.textSub },
            ]}
          >
            運営：SereNote Apps（個人事業主：浪岡賢孝）
          </Text>
          <Text
            style={[
              styles.footerText,
              { color: theme.colors.textSub },
            ]}
          >
            所在地：日本
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
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
  appName: {
    fontSize: 18,
    fontWeight: '700',
  },
  appMeta: {
    fontSize: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
  },
  card: {
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardText: {
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 18,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 2,
  },
  footer: {
    marginTop: 20,
  },
  footerText: {
    fontSize: 11,
  },
});