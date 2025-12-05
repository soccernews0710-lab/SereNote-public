// app/(tabs)/stats.tsx
import * as FileSystem from 'expo-file-system';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
  Svg,
} from 'react-native-svg';

import { getTodayKey } from '../../hooks/useDayEvents';
import { loadAllEntries, saveAllEntries } from '../../src/storage/serenoteStorage';
import { useTheme } from '../../src/theme/useTheme';
import type {
  DateKey,
  SerenoteEntry,
  SerenoteEntryMap,
} from '../../src/types/serenote';

// ========= 設定・型 =========

type StatsPeriod = '7d' | '30d' | '90d';

// 睡眠のボリューム感
type SleepQualityTag = 'データなし' | '少なめ' | 'ちょうど良い' | '多め';

// 1日ぶんの集計
type StatsRow = {
  dateKey: DateKey;
  dateLabel: string;
  moodAvg: number | null; // 1〜5 に正規化した平均
  moodMin: number | null;
  moodMax: number | null;
  sleepMinutes: number | null; // 1日分の睡眠合計（分）
  medsCount: number;
  notesCount: number;
  symptomsCount: number;
};

// グラフ用のポイント
type ChartPoint = {
  index: number; // 0,1,2...
  label: string; // 日付ラベル
  value: number;
};

// 診察用に集める症状
export type DoctorSymptomItem = {
  id: string;
  date: DateKey;
  time?: string;
  label: string;
  memo?: string;
  forDoctor?: boolean;
};

// ========= 日付ユーティリティ =========

function formatDateLabel(dateKey: DateKey): string {
  return dateKey;
}

function parseDate(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date: Date, diff: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + diff);
  return d;
}

function formatDateKey(date: Date): DateKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getPrevDateKey(date: DateKey): DateKey {
  return formatDateKey(addDays(parseDate(date), -1));
}

function getDateRange(endDateKey: DateKey, days: number): DateKey[] {
  const end = parseDate(endDateKey);
  const list: DateKey[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(end, -i);
    list.push(formatDateKey(d));
  }
  return list;
}

// ========= 睡眠関連 =========

function parseHHMMToMinutes(text: string | undefined | null): number | null {
  if (!text) return null;
  const m = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  return h * 60 + min;
}

/**
 * 1日あたりの睡眠時間（分）を求める
 */
function calcDailySleepMinutes(
  date: DateKey,
  allEntries: SerenoteEntryMap
): number | null {
  const entry = allEntries[date];
  if (!entry) return null;

  const explicitTotal = entry.sleep?.totalMinutes;
  if (typeof explicitTotal === 'number') return explicitTotal;

  const todayWake = parseHHMMToMinutes(entry.sleep?.wakeTime ?? null);

  const prev = allEntries[getPrevDateKey(date)];
  const bedStr = prev?.sleep?.bedTime ?? entry.sleep?.bedTime ?? null;

  const bed = parseHHMMToMinutes(bedStr);

  if (bed == null || todayWake == null) return null;

  let diff = todayWake - bed;
  if (diff <= 0) diff += 24 * 60;

  return diff;
}

function sleepMinutesToQualityTag(totalMinutes: number | null): SleepQualityTag {
  if (totalMinutes == null) return 'データなし';
  if (totalMinutes < 360) return '少なめ';
  if (totalMinutes <= 540) return 'ちょうど良い';
  return '多め';
}

// ========= 気分 / メモ / 薬 集計 =========

function calcDailyMoodAverage(
  entry: SerenoteEntry | undefined
): {
  avg: number | null;
  min: number | null;
  max: number | null;
} {
  if (!entry || !entry.mood || entry.mood.value == null) {
    return { avg: null, min: null, max: null };
  }

  const raw = entry.mood.value as number;
  const clamped = Math.min(5, Math.max(1, raw));

  return {
    avg: clamped,
    min: clamped,
    max: clamped,
  };
}

function calcDailyMedsCount(entry: SerenoteEntry | undefined): number {
  if (!entry || !entry.medications) return 0;
  return entry.medications.length;
}

function calcDailyNotesAndSymptomsCount(
  entry: SerenoteEntry | undefined
): { notes: number; symptoms: number } {
  if (!entry) return { notes: 0, symptoms: 0 };
  const notes = entry.notes?.length ?? 0;
  const symptoms = entry.symptoms?.length ?? 0;
  return { notes, symptoms };
}

// ========= StatsRow ビルド =========

function buildStatsRowsForPeriod(
  allEntries: SerenoteEntryMap,
  period: StatsPeriod
): StatsRow[] {
  const todayKey = getTodayKey();
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const dateKeys = getDateRange(todayKey, days);

  const rows: StatsRow[] = dateKeys.map(dateKey => {
    const entry = allEntries[dateKey];
    const mood = calcDailyMoodAverage(entry);
    const sleepMinutes = calcDailySleepMinutes(dateKey, allEntries);
    const medsCount = calcDailyMedsCount(entry);
    const { notes, symptoms } = calcDailyNotesAndSymptomsCount(entry);

    return {
      dateKey,
      dateLabel: formatDateLabel(dateKey),
      moodAvg: mood.avg,
      moodMin: mood.min,
      moodMax: mood.max,
      sleepMinutes,
      medsCount,
      notesCount: notes,
      symptomsCount: symptoms,
    };
  });

  return rows;
}

// ========= 集計（サマリー表示用） =========

function calcMoodSummary(rows: StatsRow[]) {
  const values = rows
    .map(r => r.moodAvg)
    .filter((v): v is number => v != null);

  if (values.length === 0) {
    return {
      avgScore: null as number | null,
      avgLabel: '—',
      stabilityLabel: 'データなし',
    };
  }

  const sum = values.reduce((acc, v) => acc + v, 0);
  const avg = sum / values.length;

  let avgLabel = '—';
  if (avg < 1.5) avgLabel = 'とてもつらい';
  else if (avg < 2.5) avgLabel = 'つらい';
  else if (avg < 3.5) avgLabel = 'ふつう';
  else if (avg < 4.5) avgLabel = '少し良い';
  else avgLabel = 'とても良い';

  const max = Math.max(...values);
  const min = Math.min(...values);
  const diff = max - min;

  let stabilityLabel = '気分はかなり安定';
  if (diff >= 1.5) stabilityLabel = '気分の波が大きめ';
  else if (diff >= 0.8) stabilityLabel = 'やや変動あり';

  return { avgScore: avg, avgLabel, stabilityLabel };
}

function calcSleepSummary(rows: StatsRow[]) {
  const values = rows
    .map(r => r.sleepMinutes)
    .filter((v): v is number => v != null);

  if (values.length === 0) {
    return {
      avgHours: null as number | null,
      daysWithData: 0,
      volumeTag: 'データなし' as SleepQualityTag,
    };
  }

  const sum = values.reduce((acc, v) => acc + v, 0);
  const avgMinutes = sum / values.length;
  const avgHours = avgMinutes / 60;

  const volumeTag = sleepMinutesToQualityTag(avgMinutes);

  return {
    avgHours,
    daysWithData: values.length,
    volumeTag,
  };
}

function calcMedsSummary(rows: StatsRow[]) {
  const counts = rows.map(r => r.medsCount);
  const sum = counts.reduce((acc, v) => acc + v, 0);
  const avgPerDay = counts.length > 0 ? sum / counts.length : 0;
  const daysWithMeds = counts.filter(c => c > 0).length;

  return { avgPerDay, daysWithMeds };
}

function calcNotesSummary(rows: StatsRow[]) {
  const totals = rows.map(r => r.notesCount + r.symptomsCount);
  const sum = totals.reduce((acc, v) => acc + v, 0);
  const avgPerDay = totals.length > 0 ? sum / totals.length : 0;
  const daysWithAny = totals.filter(c => c > 0).length;

  return { avgPerDay, daysWithAny };
}

// ========= グラフ用データ変換 =========

function buildChartPoints(
  rows: StatsRow[],
  selector: (row: StatsRow) => number | null
): ChartPoint[] {
  const pts: ChartPoint[] = [];
  rows.forEach(row => {
    const v = selector(row);
    if (v == null) return;
    pts.push({
      index: pts.length,
      label: row.dateLabel,
      value: v,
    });
  });
  return pts;
}

// ========= 「診察で話したい」症状抽出 =========

function collectDoctorSymptoms(all: SerenoteEntryMap): DoctorSymptomItem[] {
  const items: DoctorSymptomItem[] = [];

  Object.entries(all).forEach(([date, entry]) => {
    const symptoms: any[] | undefined = (entry as any).symptoms;
    if (!symptoms || symptoms.length === 0) return;

    symptoms.forEach(sym => {
      if (sym.forDoctor) {
        items.push({
          id: sym.id ?? `${date}_${sym.time ?? ''}_${sym.label}`,
          date: date as DateKey,
          time: sym.time,
          label: sym.label,
          memo: sym.memo,
          forDoctor: sym.forDoctor,
        });
      }
    });
  });

  return items.sort((a, b) => {
    if (a.date === b.date) {
      return (b.time ?? '').localeCompare(a.time ?? '');
    }
    return b.date.localeCompare(a.date);
  });
}

// ========= ラインチャートコンポーネント =========

type LineChartProps = {
  color: string;
  points: ChartPoint[];
  yMin: number;
  yMax: number;
  height?: number;
  valueFormatter?: (v: number) => string;
};

const LineChart: React.FC<LineChartProps> = ({
  color,
  points,
  yMin,
  yMax,
  height = 140,
  valueFormatter,
}) => {
  const { theme } = useTheme();

  const [width, setWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [points.length, width, fadeAnim]);

  if (points.length === 0) {
    return (
      <View
        style={[
          styles.chartPlaceholderBox,
          {
            borderColor: theme.colors.borderSoft,
            backgroundColor: theme.colors.surfaceAlt,
          },
        ]}
        onLayout={handleLayout}
      >
        <Text
          style={[
            styles.chartPlaceholderText,
            { color: theme.colors.textSub },
          ]}
        >
          まだデータがありません
        </Text>
      </View>
    );
  }

  if (width === 0) {
    return (
      <View
        style={[
          styles.chartPlaceholderBox,
          {
            borderColor: theme.colors.borderSoft,
            backgroundColor: theme.colors.surfaceAlt,
          },
        ]}
        onLayout={handleLayout}
      />
    );
  }

  const paddingX = 12;
  const paddingY = 10;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const minY = yMin;
  const maxY = yMax;
  const rangeY = maxY - minY || 1;

  const xs: number[] = [];
  const ys: number[] = [];

  points.forEach((p, i) => {
    const t = points.length === 1 ? 0.5 : i / (points.length - 1);
    const x = paddingX + t * innerWidth;
    const norm = (p.value - minY) / rangeY;
    const y = paddingY + innerHeight - norm * innerHeight;
    xs.push(x);
    ys.push(y);
  });

  let d = '';
  xs.forEach((x, i) => {
    const y = ys[i];
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });

  const selected =
    selectedIndex != null && points[selectedIndex]
      ? {
          ...points[selectedIndex],
          x: xs[selectedIndex],
          y: ys[selectedIndex],
        }
      : null;

  const handleTouch = (e: GestureResponderEvent) => {
    const { locationX } = e.nativeEvent;
    const x = Math.min(width - paddingX, Math.max(paddingX, locationX));
    const ratio = points.length === 1 ? 0 : (x - paddingX) / innerWidth;
    const idx = Math.round(ratio * (points.length - 1));
    setSelectedIndex(idx);
  };

  return (
    <View
      style={[
        styles.chartTouchArea,
        {
          borderColor: theme.colors.borderSoft,
          backgroundColor: theme.colors.surfaceAlt,
        },
      ]}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <Stop offset="100%" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {d && (
            <Path
              d={`${d} L ${xs[xs.length - 1]} ${height - paddingY} L ${
                xs[0]
              } ${height - paddingY} Z`}
              fill="url(#lineGrad)"
              stroke="none"
            />
          )}

          {d && <Path d={d} stroke={color} strokeWidth={2} fill="none" />}

          {xs.map((x, i) => (
            <Circle
              key={`pt-${i}`}
              cx={x}
              cy={ys[i]}
              r={selectedIndex === i ? 4.5 : 3}
              fill={selectedIndex === i ? color : '#ffffff'}
              stroke={color}
              strokeWidth={1.5}
            />
          ))}
        </Svg>
      </Animated.View>

      <View style={styles.chartTooltipBox}>
        {selected ? (
          <>
            <Text
              style={[
                styles.chartTooltipDate,
                { color: theme.colors.textSub },
              ]}
            >
              {selected.label}
            </Text>
            <Text
              style={[
                styles.chartTooltipValue,
                { color: theme.colors.textMain },
              ]}
            >
              {valueFormatter
                ? valueFormatter(selected.value)
                : selected.value.toFixed(2)}
            </Text>
          </>
        ) : (
          <Text
            style={[
              styles.chartTooltipHint,
              { color: theme.colors.textSub },
            ]}
          >
            グラフをタップすると、その日の値が表示されます
          </Text>
        )}
      </View>
    </View>
  );
};

// ========= 画面コンポーネント =========

export default function StatsScreen() {
  const { theme } = useTheme();

  const [allEntries, setAllEntries] = useState<SerenoteEntryMap>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<StatsPeriod>('7d');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);

      (async () => {
        try {
          const loaded = (await loadAllEntries()) ?? {};
          if (cancelled) return;
          setAllEntries(loaded);
        } catch (e) {
          console.warn('Failed to load entries for Stats', e);
          if (!cancelled) {
            setAllEntries({});
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  const rows = useMemo(
    () => buildStatsRowsForPeriod(allEntries, period),
    [allEntries, period]
  );

  const moodSummary = useMemo(() => calcMoodSummary(rows), [rows]);
  const sleepSummary = useMemo(() => calcSleepSummary(rows), [rows]);
  const medsSummary = useMemo(() => calcMedsSummary(rows), [rows]);
  const notesSummary = useMemo(() => calcNotesSummary(rows), [rows]);

  const moodPoints = useMemo(
    () => buildChartPoints(rows, r => r.moodAvg),
    [rows]
  );
  const sleepPoints = useMemo(
    () =>
      buildChartPoints(rows, r =>
        r.sleepMinutes != null ? r.sleepMinutes / 60 : null
      ),
    [rows]
  );
  const medsPoints = useMemo(
    () => buildChartPoints(rows, r => (r.medsCount > 0 ? r.medsCount : null)),
    [rows]
  );
  const notesPoints = useMemo(
    () =>
      buildChartPoints(rows, r => {
        const total = r.notesCount + r.symptomsCount;
        return total > 0 ? total : null;
      }),
    [rows]
  );

  // 🆕 診察用メモ一覧
  const doctorSymptoms = useMemo(
    () => collectDoctorSymptoms(allEntries),
    [allEntries]
  );

  const sleepYMax =
    sleepPoints.length > 0
      ? Math.max(10, Math.ceil(Math.max(...sleepPoints.map(p => p.value)) + 1))
      : 10;

  const medsYMax =
    medsPoints.length > 0
      ? Math.max(4, Math.max(...medsPoints.map(p => p.value)))
      : 4;

  const notesYMax =
    notesPoints.length > 0
      ? Math.max(4, Math.max(...notesPoints.map(p => p.value)))
      : 4;

  const periodLabel =
    period === '7d'
      ? '直近 7 日'
      : period === '30d'
      ? '直近 30 日'
      : '直近 90 日';

  // ===== 診察用メモを .txt でエクスポート =====
  const handleExportDoctorSymptoms = async () => {
    if (doctorSymptoms.length === 0) return;

    const lines: string[] = [];

    doctorSymptoms.forEach(item => {
      lines.push(
        `■ ${item.date}${item.time ? ` ${item.time}` : ''}  ${item.label}`
      );
      if (item.memo) {
        lines.push(`  メモ: ${item.memo}`);
      }
      lines.push('');
    });

    const text = lines.join('\n');

    try {
      const fileName = `serenote-doctor-notes-${Date.now()}.txt`;

      const baseDir: string | null =
        (FileSystem as any).cacheDirectory ??
        (FileSystem as any).documentDirectory ??
        null;

      if (!baseDir) {
        console.warn('No suitable directory for export');
        return;
      }

      const fileUri = baseDir + fileName;

      await FileSystem.writeAsStringAsync(fileUri, text, {
        encoding: ((FileSystem as any).EncodingType?.UTF8 ?? 'utf8') as any,
      });

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/plain',
            dialogTitle: '診察用メモを共有',
          });
        } else {
          console.log('Sharing not available on this platform');
        }
      } else {
        console.log('File written to', fileUri);
      }
    } catch (e) {
      console.warn('Export doctor symptoms failed', e);
      Alert.alert('エラー', 'テキストの出力に失敗しました。もう一度お試しください。');
    }
  };

  // ===== 診察用メモの forDoctor フラグを一括リセット =====
  const handleResetDoctorSymptoms = () => {
    if (doctorSymptoms.length === 0) return;

    Alert.alert(
      '診察メモをリセット',
      '「診察で話したい」にチェックしたフラグをすべて外します。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated: SerenoteEntryMap = {};

              Object.entries(allEntries).forEach(([date, entry]) => {
                const symptoms: any[] | undefined = (entry as any).symptoms;
                if (!symptoms || symptoms.length === 0) {
                  updated[date as DateKey] = entry;
                  return;
                }

                const newSymptoms = symptoms.map(sym =>
                  sym.forDoctor ? { ...sym, forDoctor: false } : sym
                );

                updated[date as DateKey] = {
                  ...entry,
                  symptoms: newSymptoms,
                } as SerenoteEntry;
              });

              await saveAllEntries(updated);
              setAllEntries(updated);
            } catch (e) {
              console.warn('Failed to reset doctor symptoms', e);
              Alert.alert(
                'エラー',
                'リセットに失敗しました。もう一度お試しください。'
              );
            }
          },
        },
      ]
    );
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
            記録を読み込み中…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* 画面タイトル */}
        <View style={styles.headerRow}>
          <View>
            <Text
              style={[
                styles.screenTitle,
                { color: theme.colors.textMain },
              ]}
            >
              Stats
            </Text>
            <Text
              style={[
                styles.screenSubtitle,
                { color: theme.colors.textSub },
              ]}
            >
              最近の自分のパターンを見返してみましょう
            </Text>
          </View>

          {/* 期間切り替え */}
          <View
            style={[
              styles.periodSwitcher,
              { backgroundColor: theme.colors.surfaceAlt },
            ]}
          >
            {(['7d', '30d', '90d'] as StatsPeriod[]).map(p => {
              const active = period === p;
              const label = p === '7d' ? '7日' : p === '30d' ? '30日' : '90日';
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPeriod(p)}
                  style={[
                    styles.periodChip,
                    active && {
                      backgroundColor: theme.colors.textMain,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.periodChipText,
                      active
                        ? { color: theme.colors.background }
                        : { color: theme.colors.textSub },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* === 気分の傾向 === */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text
              style={[
                styles.cardTitle,
                { color: theme.colors.textMain },
              ]}
            >
              気分の傾向
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

          <LineChart
            color={theme.colors.accentMood}
            points={moodPoints}
            yMin={1}
            yMax={5}
            height={150}
            valueFormatter={v => `${v.toFixed(2)} / 5`}
          />

          <View style={styles.cardBottomRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardLabel,
                  { color: theme.colors.textSub },
                ]}
              >
                平均スコア
              </Text>
              <Text
                style={[
                  styles.cardValue,
                  { color: theme.colors.textMain },
                ]}
              >
                {moodSummary.avgScore
                  ? moodSummary.avgScore.toFixed(2)
                  : '—'}
              </Text>
              <Text
                style={[
                  styles.cardSub,
                  { color: theme.colors.textSub },
                ]}
              >
                {moodSummary.avgLabel}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardLabel,
                  { color: theme.colors.textSub },
                ]}
              >
                気分の安定度
              </Text>
              <Text
                style={[
                  styles.cardValue,
                  {
                    fontSize: 15,
                    lineHeight: 20,
                    color: theme.colors.textMain,
                  },
                ]}
              >
                {moodSummary.stabilityLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* === 睡眠パターン === */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text
              style={[
                styles.cardTitle,
                { color: theme.colors.textMain },
              ]}
            >
              睡眠パターン
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

          <LineChart
            color={theme.colors.accentSleep}
            points={sleepPoints}
            yMin={0}
            yMax={sleepYMax}
            height={150}
            valueFormatter={v => `${v.toFixed(1)} h`}
          />

          <View style={styles.cardBottomRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardLabel,
                  { color: theme.colors.textSub },
                ]}
              >
                平均睡眠時間
              </Text>
              <Text
                style={[
                  styles.cardValue,
                  { color: theme.colors.textMain },
                ]}
              >
                {sleepSummary.avgHours != null
                  ? `${sleepSummary.avgHours.toFixed(1)} h`
                  : '—'}
              </Text>
              <Text
                style={[
                  styles.cardSub,
                  { color: theme.colors.textSub },
                ]}
              >
                睡眠データのある日: {sleepSummary.daysWithData} 日
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardLabel,
                  { color: theme.colors.textSub },
                ]}
              >
                睡眠のボリューム感
              </Text>
              <Text
                style={[
                  styles.cardValue,
                  { color: theme.colors.textMain },
                ]}
              >
                {sleepSummary.volumeTag}
              </Text>
            </View>
          </View>
        </View>

        {/* === 服薬の記録 === */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text
              style={[
                styles.cardTitle,
                { color: theme.colors.textMain },
              ]}
            >
              服薬の記録
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

          <LineChart
            color={theme.colors.accentMeds}
            points={medsPoints}
            yMin={0}
            yMax={medsYMax}
            height={140}
            valueFormatter={v => `${v.toFixed(1)} 回`}
          />

          <View style={styles.cardBottomRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardLabel,
                  { color: theme.colors.textSub },
                ]}
              >
                平均回数 / 日
              </Text>
              <Text
                style={[
                  styles.cardValue,
                  { color: theme.colors.textMain },
                ]}
              >
                {medsSummary.avgPerDay.toFixed(2)} 回
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardLabel,
                  { color: theme.colors.textSub },
                ]}
              >
                服薬を記録した日
              </Text>
              <Text
                style={[
                  styles.cardValue,
                  { color: theme.colors.textMain },
                ]}
              >
                {medsSummary.daysWithMeds} 日
              </Text>
            </View>
          </View>
        </View>

        {/* === メモ / 症状 === */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text
              style={[
                styles.cardTitle,
                { color: theme.colors.textMain },
              ]}
            >
              メモ / 症状の記録
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

          <LineChart
            color={theme.colors.accentNotes}
            points={notesPoints}
            yMin={0}
            yMax={notesYMax}
            height={140}
            valueFormatter={v => `${v.toFixed(1)} 件`}
          />

          <View style={styles.cardBottomRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardLabel,
                  { color: theme.colors.textSub },
                ]}
              >
                平均件数 / 日
              </Text>
              <Text
                style={[
                  styles.cardValue,
                  { color: theme.colors.textMain },
                ]}
              >
                {notesSummary.avgPerDay.toFixed(2)} 件
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardLabel,
                  { color: theme.colors.textSub },
                ]}
              >
                書いた日数
              </Text>
              <Text
                style={[
                  styles.cardValue,
                  { color: theme.colors.textMain },
                ]}
              >
                {notesSummary.daysWithAny} 日
              </Text>
            </View>
          </View>
        </View>

        {/* === 🆕 診察で話したい症状一覧 === */}
        <View
          style={[
            styles.sectionBox,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderSoft,
            },
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 8,
              alignItems: 'center',
            }}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.textMain },
              ]}
            >
              診察で話したい症状メモ
            </Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={handleExportDoctorSymptoms}
                disabled={doctorSymptoms.length === 0}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: theme.colors.borderSoft,
                  opacity: doctorSymptoms.length === 0 ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.textSub,
                  }}
                >
                  ↑ エクスポート
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleResetDoctorSymptoms}
                disabled={doctorSymptoms.length === 0}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: theme.colors.borderSoft,
                  opacity: doctorSymptoms.length === 0 ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.textSub,
                  }}
                >
                  ✓ リセット
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {doctorSymptoms.length === 0 ? (
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.textSub,
              }}
            >
              「症状」追加モーダルで「診察で話したい」にチェックすると、
              ここに一覧で表示されます。
            </Text>
          ) : (
            doctorSymptoms.map(item => (
              <View
                key={item.id}
                style={[
                  styles.symptomCard,
                  { borderBottomColor: theme.colors.borderSoft },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: theme.colors.textSub,
                    marginBottom: 2,
                  }}
                >
                  {item.date}
                  {item.time ? `  ${item.time}` : ''}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme.colors.textMain,
                  }}
                >
                  {item.label}
                </Text>
                {item.memo ? (
                  <Text
                    style={{
                      marginTop: 2,
                      fontSize: 12,
                      color: theme.colors.textSub,
                    }}
                  >
                    {item.memo}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ========= スタイル =========

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  screenSubtitle: {
    marginTop: 2,
    fontSize: 13,
  },
  periodSwitcher: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    borderRadius: 999,
  },
  periodChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  periodChipText: {
    fontSize: 11,
    fontWeight: '500',
  },

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

  cardBottomRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  cardLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 11,
    marginTop: 2,
  },

  chartPlaceholderBox: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: 12,
  },

  chartTouchArea: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  chartTooltipBox: {
    marginTop: 6,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTooltipHint: {
    fontSize: 11,
  },
  chartTooltipDate: {
    fontSize: 11,
  },
  chartTooltipValue: {
    fontSize: 13,
    fontWeight: '600',
  },

  sectionBox: {
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  symptomCard: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
});