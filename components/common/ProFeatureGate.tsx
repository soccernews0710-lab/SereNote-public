// components/common/ProFeatureGate.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSubscription } from '../../src/subscription/useSubscription';
import { useTheme } from '../../src/theme/useTheme';

type Props = {
  children: React.ReactNode;
  featureName?: string; // 例: "データ出力", "詳細Stats" など
};

export const ProFeatureGate: React.FC<Props> = ({
  children,
  featureName = 'この機能',
}) => {
  const { isPro } = useSubscription();
  const { theme } = useTheme();

  if (isPro) {
    // Pro ユーザー → そのまま中身を表示
    return <>{children}</>;
  }

  // Free ユーザー → ロック表示
  return (
    <View
      style={[
        styles.lockBox,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.borderSoft },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: theme.colors.textMain },
        ]}
      >
        SereNote Pro が必要です
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: theme.colors.textSub },
        ]}
      >
        {featureName} は現在の無料プランでは利用できません。
        将来的にサブスクリプション購入画面から解放される予定です。
      </Text>
      {/* 将来ここに「購入する」ボタンや課金処理を追加 */}
    </View>
  );
};

const styles = StyleSheet.create({
  lockBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
});