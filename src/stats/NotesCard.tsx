// app/stats/NotesCard.tsx （または src/stats/NotesCard.tsx に配置して OK）

import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { StatsRow } from '../../src/stats/statsLogic';
import { useTheme } from '../../src/theme/useTheme';

type Props = {
  rows: StatsRow[];
  periodLabel: string;
};

/**
 * メモ & 症状のサマリーカード
 *
 * ・この期間のメモ件数
 * ・この期間の症状件数
 * ・記録のある日数
 * ・History へのショートカット
 */
export const NotesCard: React.FC<Props> = ({ rows, periodLabel }) => {
  const { theme } = useTheme();
  const router = useRouter();

  const summary = useMemo(() => {
    let totalNotes = 0;
    let totalSymptoms = 0;
    let daysWithAnything = 0;

    rows.forEach(row => {
      const notesCount =
        (row as any).notesCount != null ? (row as any).notesCount : 0;
      const symptomCount =
        (row as any).symptomCount != null
          ? (row as any).symptomCount
          : (row as any).symptomsCount != null
          ? (row as any).symptomsCount
          : 0;

      totalNotes += notesCount;
      totalSymptoms += symptomCount;
      if (notesCount > 0 || symptomCount > 0) {
        daysWithAnything += 1;
      }
    });

    return {
      totalNotes,
      totalSymptoms,
      daysWithAnything,
    };
  }, [rows]);

  const hasData =
    summary.totalNotes > 0 || summary.totalSymptoms > 0;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      {/* ヘッダー */}
      <View style={styles.cardHeader}>
        <Text
          style={[
            styles.cardTitle,
            { color: theme.colors.textMain },
          ]}
        >
          メモ・症状のまとめ
        </Text>
        <Text
          style={[
            styles.cardPeriodText,
            { color: theme.colors.textSub },
          ]}
        >
          {periodLabel}
        </Text>
      </View>

      {/* 本文 */}
      {hasData ? (
        <>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text
                style={[
                  styles.label,
                  { color: theme.colors.textSub },
                ]}
              >
                メモ
              </Text>
              <Text
                style={[
                  styles.value,
                  { color: theme.colors.textMain },
                ]}
              >
                {summary.totalNotes} 件
              </Text>
            </View>

            <View style={styles.col}>
              <Text
                style={[
                  styles.label,
                  { color: theme.colors.textSub },
                ]}
              >
                症状の記録
              </Text>
              <Text
                style={[
                  styles.value,
                  { color: theme.colors.textMain },
                ]}
              >
                {summary.totalSymptoms} 件
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.helper,
              { color: theme.colors.textSub },
            ]}
          >
            何かしら記録のある日: {summary.daysWithAnything} 日
          </Text>

          {/* History へのショートカット */}
          <TouchableOpacity
            style={[
              styles.linkButton,
              { borderColor: theme.colors.borderSoft },
            ]}
            activeOpacity={0.8}
            onPress={() => {
              // 将来「症状だけフィルタ」を入れたら
              // クエリ付きで /history に飛ばしてもOK
              router.push('/history');
            }}
          >
            <Text
              style={[
                styles.linkText,
                { color: theme.colors.textSub },
              ]}
            >
              くわしく見る（Historyへ）
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text
          style={[
            styles.helper,
            { color: theme.colors.textSub },
          ]}
        >
          この期間にはメモや症状の記録がありません。
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  cardPeriodText: {
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  helper: {
    fontSize: 11,
    marginTop: 4,
  },
  linkButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  linkText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

// デフォルトエクスポートにしておくと扱いやすい場合はこれも
export default NotesCard;