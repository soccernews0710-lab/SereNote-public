// components/settings/TermsOfUseContent.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const TermsOfUseContent: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        SereNote 利用規約（Version 1.0）
      </Text>
      <Text style={styles.text}>最終更新日：2025年〇月〇日</Text>

      <Text style={styles.text}>
        本利用規約（以下、「本規約」）は、SereNote Apps（以下、「当事業者」）が提供する
        アプリケーション「SereNote」（以下、「本アプリ」）の利用条件を定めるものです。
        本アプリを利用することで、本規約に同意したものとみなします。
      </Text>

      <Text style={styles.subheading}>第1条（運営者情報）</Text>
      <Text style={styles.text}>・運営者名：SereNote Apps</Text>
      <Text style={styles.text}>・代表者（個人事業主）：浪岡 賢孝</Text>
      <Text style={styles.text}>・所在地：日本</Text>
      <Text style={styles.text}>
        ・お問い合わせ：contact@sere-note.app（仮）
      </Text>

      <Text style={styles.subheading}>第2条（提供サービス）</Text>
      <Text style={styles.text}>
        本アプリは、睡眠・起床、気分、症状、お薬、メモなどの記録機能および、
        履歴・統計による振り返り機能を提供します。
      </Text>
      <Text style={styles.text}>
        本アプリは医療サービスではなく、診断・治療・医学的判断を行うものではありません。
        あくまでユーザー自身の健康管理・生活ログを補助するツールです。
      </Text>

      <Text style={styles.subheading}>第3条（禁止事項）</Text>
      <Text style={styles.text}>
        ユーザーは、本アプリの利用にあたり、以下の行為をしてはなりません。
      </Text>
      <Text style={styles.text}>・法令または公序良俗に反する行為</Text>
      <Text style={styles.text}>
        ・本アプリを医療行為に該当するような用途で用いること
      </Text>
      <Text style={styles.text}>・他者を誹謗中傷する情報の入力・送信</Text>
      <Text style={styles.text}>
        ・不正アクセス、リバースエンジニアリング、改変などの技術的な不正行為
      </Text>
      <Text style={styles.text}>
        ・本アプリの運営を妨げる行為その他、当事業者が不適切と判断する行為
      </Text>

      <Text style={styles.subheading}>第4条（データの管理）</Text>
      <Text style={styles.text}>
        本アプリに入力されたデータは、原則としてユーザーの端末内に保存されます。
        当事業者はユーザーの健康データ・記録内容をサーバー側で保存・閲覧しません。
      </Text>
      <Text style={styles.text}>
        ユーザーは、自らの責任においてデータを管理し、必要に応じてバックアップを行うものとします。
      </Text>

      <Text style={styles.subheading}>第5条（免責事項）</Text>
      <Text style={styles.text}>
        1. 本アプリは医学的判断や診断を提供するものではありません。体調に不安がある場合は、
        必ず医師などの専門家に相談してください。
      </Text>
      <Text style={styles.text}>
        2. 本アプリの利用または利用不能によりユーザーに生じた損害について、
        当事業者は一切の責任を負わないものとします。
      </Text>
      <Text style={styles.text}>
        3. 当事業者は、本アプリの仕様変更・一時停止・終了等を行うことができるものとし、
        これによりユーザーに損害が生じた場合でも責任を負いません。
      </Text>

      <Text style={styles.subheading}>第6条（利用規約の変更）</Text>
      <Text style={styles.text}>
        当事業者は、必要に応じて本規約を変更することがあります。
        変更後の規約は、本アプリ内に表示した時点で効力を生じるものとします。
      </Text>

      <Text style={styles.subheading}>第7条（準拠法）</Text>
      <Text style={styles.text}>
        本規約は、日本法を準拠法とし、日本法に従って解釈されます。
      </Text>
    </View>
  );
};

export default TermsOfUseContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subheading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginTop: 10,
    marginBottom: 4,
  },
  text: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 4,
  },
});