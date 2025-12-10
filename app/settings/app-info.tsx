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

        {/* 医療行為ではないこと・緊急時のお願い */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.textMain },
          ]}
        >
          医療行為ではないこと・緊急時のお願い
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
            ・SereNote は、こころやからだの状態を振り返るための
              自己記録アプリです。医師・看護師・臨床心理士などの
              専門家による診療やカウンセリングの代わりにはなりません。
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            ・アプリ内の表示内容やタイムラインの投稿は、
              いずれも診断・治療・予防を約束するものではありません。
              治療中の方は、必ず主治医など専門家の指示を優先してください。
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            ・「今すぐ命の危険を感じる」「自分や他人を傷つけてしまいそう」など、
              緊急の状況では、このアプリでは対応できません。
              そのような場合は、救急や地域の相談窓口などの公的な支援につながってください。
          </Text>
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
            SereNote では、ユーザーが入力した記録データのうち、
            日々の睡眠・気分・症状・お薬・メモなどの情報は
            原則として端末ローカル（お使いのスマートフォン内）に保存されます。
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            一方で、以下の情報については、アプリの機能を提供するために
            Google のクラウドサービス（Firebase）上に保存されることがあります：
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            ・プロフィール情報（ニックネーム / 性別 / 年代 / プロフィール画像のURL など）
            {'\n'}
            ・タイムラインへの投稿内容（画像・一言メッセージ・投稿者のニックネームなど）
            {'\n'}
            ・ユーザーを識別するための匿名の ID（Firebase Auth の UID）
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            これらの情報は、アプリの表示・タイムライン機能の提供・
            統計的な分析によるサービス改善のためにのみ利用されます。
            個人を特定できる形で第三者に販売することはありません。
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            将来的に広告や追加のサブスクリプション機能を導入する場合は、
            本ポリシーを更新し、アプリ内で明示的にお知らせします。
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
            ・日々の記録（睡眠・気分・症状・お薬・メモなど）は、
              端末内のストレージに保存され、ユーザーの操作なく
              自動的に外部へ送信されることはありません。
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            ・プロフィール情報やタイムラインへの投稿は、
              Firebase（Firestore / Storage）に保存され、
              アプリの機能提供のために利用されます。
              これらは安全な通信経路で送信されます。
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            ・ユーザーは、プロフィール編集や投稿削除機能を通じて、
              自身のニックネームやプロフィール画像、投稿内容を
              いつでも変更・削除することができます。
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            ・バックアップが必要な場合は、
              スクリーンショットや、今後追加予定の
              データエクスポート機能などをご利用ください。
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
            通知に関する設定情報は端末内で管理され、
            当事業者のサーバーには送信されません。
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
            ・直近7日 / 14日 / 30日を切り替えて、
              気分・睡眠・服薬状況・メモ/症状の量を振り返れます。
          </Text>

          <Text
            style={[
              styles.guideTitle,
              { color: theme.colors.textMain },
            ]}
          >
            Timeline（タイムライン）タブ
          </Text>
          <Text
            style={[
              styles.cardText,
              { color: theme.colors.textMain },
            ]}
          >
            ・好きな画像と100文字までの一言で、
              そのときの気持ちや出来事をゆるくシェアできます。
              他のユーザーの投稿も閲覧できます。
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
            ・ニックネームやプロフィール、テーマカラー、
              お薬・リマインド時刻の設定、アプリ情報の確認ができます。
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
          <Text
            style={[
              styles.footerTextSmall,
              { color: theme.colors.textSub },
            ]}
          >
            ※本画面の内容は、将来的に正式な利用規約・
              プライバシーポリシーとして更新される予定です。
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
  footerTextSmall: {
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
  },
});