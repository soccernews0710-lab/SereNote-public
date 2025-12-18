// components/relax/BreathingExerciseModal.tsx
// 呼吸エクササイズ機能 - 不安なときに使えるリラックスツール

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../src/theme/useTheme';

// 🆕 バッジ用カウント
import { incrementBreathingCount } from '../../src/badges/badgeLogic';

type BreathingPattern = {
  id: string;
  name: string;
  description: string;
  inhale: number;   // 吸う（秒）
  hold1: number;    // 止める（秒）
  exhale: number;   // 吐く（秒）
  hold2: number;    // 止める（秒）
  cycles: number;   // 繰り返し回数
  isPro?: boolean;  // Pro限定
};

// 呼吸パターン定義
const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: 'basic',
    name: 'ベーシック',
    description: 'シンプルな深呼吸。初めての方におすすめ',
    inhale: 4,
    hold1: 0,
    exhale: 4,
    hold2: 0,
    cycles: 5,
  },
  {
    id: '478',
    name: '4-7-8 呼吸法',
    description: '不安を和らげる定番の呼吸法',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    cycles: 4,
  },
  {
    id: 'box',
    name: 'ボックス呼吸',
    description: '集中力を高めたいときに',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    cycles: 4,
    isPro: true,
  },
  {
    id: 'calm',
    name: 'リラックス呼吸',
    description: '眠る前や緊張をほぐしたいときに',
    inhale: 4,
    hold1: 2,
    exhale: 6,
    hold2: 2,
    cycles: 6,
    isPro: true,
  },
];

type Phase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  isPro?: boolean;
};

const BreathingExerciseModal: React.FC<Props> = ({
  visible,
  onRequestClose,
  isPro = false,
}) => {
  const { theme } = useTheme();

  // 選択中のパターン
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(
    BREATHING_PATTERNS[0]
  );

  // エクササイズ状態
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<Phase>('inhale');
  const [currentCycle, setCurrentCycle] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // アニメーション用
  const circleScale = useRef(new Animated.Value(1)).current;
  const circleOpacity = useRef(new Animated.Value(0.6)).current;

  // タイマー参照
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // モーダルが閉じたらリセット
  useEffect(() => {
    if (!visible) {
      resetExercise();
    }
  }, [visible]);

  // リセット
  const resetExercise = useCallback(() => {
    setIsRunning(false);
    setCurrentPhase('inhale');
    setCurrentCycle(1);
    setCountdown(0);
    setIsCompleted(false);
    circleScale.setValue(1);
    circleOpacity.setValue(0.6);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [circleScale, circleOpacity]);

  // フェーズの時間を取得
  const getPhaseDuration = useCallback(
    (phase: Phase): number => {
      switch (phase) {
        case 'inhale':
          return selectedPattern.inhale;
        case 'hold1':
          return selectedPattern.hold1;
        case 'exhale':
          return selectedPattern.exhale;
        case 'hold2':
          return selectedPattern.hold2;
        default:
          return 0;
      }
    },
    [selectedPattern]
  );

  // 次のフェーズを取得
  const getNextPhase = useCallback(
    (current: Phase): { phase: Phase; cycleIncrement: boolean } => {
      switch (current) {
        case 'inhale':
          return selectedPattern.hold1 > 0
            ? { phase: 'hold1', cycleIncrement: false }
            : { phase: 'exhale', cycleIncrement: false };
        case 'hold1':
          return { phase: 'exhale', cycleIncrement: false };
        case 'exhale':
          return selectedPattern.hold2 > 0
            ? { phase: 'hold2', cycleIncrement: false }
            : { phase: 'inhale', cycleIncrement: true };
        case 'hold2':
          return { phase: 'inhale', cycleIncrement: true };
        default:
          return { phase: 'inhale', cycleIncrement: false };
      }
    },
    [selectedPattern]
  );

  // アニメーション実行
  const animateCircle = useCallback(
    (phase: Phase, duration: number) => {
      const toScale = phase === 'inhale' ? 1.5 : phase === 'exhale' ? 1 : circleScale._value;
      const toOpacity = phase === 'inhale' ? 1 : phase === 'exhale' ? 0.6 : circleOpacity._value;

      Animated.parallel([
        Animated.timing(circleScale, {
          toValue: toScale,
          duration: duration * 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(circleOpacity, {
          toValue: toOpacity,
          duration: duration * 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [circleScale, circleOpacity]
  );

  // エクササイズ開始
  const startExercise = useCallback(() => {
    setIsRunning(true);
    setIsCompleted(false);
    setCurrentCycle(1);
    setCurrentPhase('inhale');

    const initialDuration = getPhaseDuration('inhale');
    setCountdown(initialDuration);
    animateCircle('inhale', initialDuration);

    let phase: Phase = 'inhale';
    let cycle = 1;
    let remaining = initialDuration;

    timerRef.current = setInterval(() => {
      remaining -= 1;

      if (remaining > 0) {
        setCountdown(remaining);
      } else {
        // 次のフェーズへ
        const next = getNextPhase(phase);
        phase = next.phase;

        if (next.cycleIncrement) {
          cycle += 1;
          setCurrentCycle(cycle);

          // 完了チェック
          if (cycle > selectedPattern.cycles) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setIsRunning(false);
            setIsCompleted(true);
            return;
          }
        }

        const nextDuration = getPhaseDuration(phase);

        // hold が 0 の場合はスキップ
        if (nextDuration === 0) {
          const skipNext = getNextPhase(phase);
          phase = skipNext.phase;
          if (skipNext.cycleIncrement) {
            cycle += 1;
            setCurrentCycle(cycle);
            if (cycle > selectedPattern.cycles) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              setIsRunning(false);
              setIsCompleted(true);
              // 🆕 バッジ用カウントを増やす
              incrementBreathingCount();
              return;
            }
          }
          const actualDuration = getPhaseDuration(phase);
          setCurrentPhase(phase);
          setCountdown(actualDuration);
          animateCircle(phase, actualDuration);
          remaining = actualDuration;
        } else {
          setCurrentPhase(phase);
          setCountdown(nextDuration);
          animateCircle(phase, nextDuration);
          remaining = nextDuration;
        }
      }
    }, 1000);
  }, [
    selectedPattern,
    getPhaseDuration,
    getNextPhase,
    animateCircle,
  ]);

  // 停止
  const stopExercise = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    resetExercise();
  }, [resetExercise]);

  // フェーズのラベル
  const getPhaseLabel = (phase: Phase): string => {
    switch (phase) {
      case 'inhale':
        return '吸う';
      case 'hold1':
      case 'hold2':
        return '止める';
      case 'exhale':
        return '吐く';
      default:
        return '';
    }
  };

  // フェーズの色
  const getPhaseColor = (phase: Phase): string => {
    switch (phase) {
      case 'inhale':
        return '#3B82F6'; // 青
      case 'hold1':
      case 'hold2':
        return '#F59E0B'; // オレンジ
      case 'exhale':
        return '#10B981'; // 緑
      default:
        return theme.colors.primary;
    }
  };

  // パターン選択
  const handleSelectPattern = (pattern: BreathingPattern) => {
    if (pattern.isPro && !isPro) {
      return; // Pro限定で未課金の場合は何もしない
    }
    setSelectedPattern(pattern);
    resetExercise();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderSoft,
            },
          ]}
        >
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.textMain }]}>
              🫁 呼吸エクササイズ
            </Text>
            <TouchableOpacity onPress={onRequestClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: theme.colors.textSub }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* パターン選択（実行中は非表示） */}
          {!isRunning && !isCompleted && (
            <View style={styles.patternSection}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textSub }]}>
                呼吸パターンを選択
              </Text>
              <View style={styles.patternList}>
                {BREATHING_PATTERNS.map(pattern => {
                  const isSelected = pattern.id === selectedPattern.id;
                  const isLocked = pattern.isPro && !isPro;

                  return (
                    <TouchableOpacity
                      key={pattern.id}
                      style={[
                        styles.patternChip,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.surfaceAlt,
                          borderColor: isSelected
                            ? 'transparent'
                            : theme.colors.borderSoft,
                          opacity: isLocked ? 0.5 : 1,
                        },
                      ]}
                      onPress={() => handleSelectPattern(pattern)}
                      disabled={isLocked}
                    >
                      <Text
                        style={[
                          styles.patternName,
                          { color: isSelected ? '#FFFFFF' : theme.colors.textMain },
                        ]}
                      >
                        {pattern.name}
                        {isLocked && ' 🔒'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.patternDesc, { color: theme.colors.textSub }]}>
                {selectedPattern.description}
              </Text>
              <Text style={[styles.patternDetail, { color: theme.colors.textSub }]}>
                {selectedPattern.inhale}秒 吸う
                {selectedPattern.hold1 > 0 && ` → ${selectedPattern.hold1}秒 止める`}
                {` → ${selectedPattern.exhale}秒 吐く`}
                {selectedPattern.hold2 > 0 && ` → ${selectedPattern.hold2}秒 止める`}
                {` × ${selectedPattern.cycles}回`}
              </Text>
            </View>
          )}

          {/* 呼吸サークル */}
          <View style={styles.circleContainer}>
            <Animated.View
              style={[
                styles.breathCircle,
                {
                  backgroundColor: getPhaseColor(currentPhase),
                  opacity: circleOpacity,
                  transform: [{ scale: circleScale }],
                },
              ]}
            />
            <View style={styles.circleContent}>
              {isRunning ? (
                <>
                  <Text style={styles.phaseLabel}>{getPhaseLabel(currentPhase)}</Text>
                  <Text style={styles.countdown}>{countdown}</Text>
                  <Text style={styles.cycleLabel}>
                    {currentCycle} / {selectedPattern.cycles}
                  </Text>
                </>
              ) : isCompleted ? (
                <>
                  <Text style={styles.completedEmoji}>✨</Text>
                  <Text style={styles.completedText}>お疲れさまでした</Text>
                </>
              ) : (
                <>
                  <Text style={styles.readyEmoji}>🫁</Text>
                  <Text style={styles.readyText}>準備OK</Text>
                </>
              )}
            </View>
          </View>

          {/* ボタン */}
          <View style={styles.buttonRow}>
            {isRunning ? (
              <TouchableOpacity
                style={[styles.stopButton, { backgroundColor: '#EF4444' }]}
                onPress={stopExercise}
              >
                <Text style={styles.buttonText}>停止</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
                onPress={isCompleted ? resetExercise : startExercise}
              >
                <Text style={styles.buttonText}>
                  {isCompleted ? 'もう一度' : 'スタート'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ヒント */}
          {!isRunning && !isCompleted && (
            <Text style={[styles.hint, { color: theme.colors.textSub }]}>
              💡 不安を感じたときや、眠れないときに試してみてください
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default BreathingExerciseModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    fontWeight: '300',
  },

  // パターン選択
  patternSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  patternList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  patternChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  patternName: {
    fontSize: 13,
    fontWeight: '500',
  },
  patternDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  patternDetail: {
    fontSize: 11,
    marginTop: 4,
  },

  // 呼吸サークル
  circleContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  breathCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  circleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  countdown: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cycleLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  readyEmoji: {
    fontSize: 48,
  },
  readyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
  },
  completedEmoji: {
    fontSize: 48,
  },
  completedText: {
    fontSize: 16,
    color: '#10B981',
    marginTop: 8,
    fontWeight: '600',
  },

  // ボタン
  buttonRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  startButton: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
  },
  stopButton: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ヒント
  hint: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
