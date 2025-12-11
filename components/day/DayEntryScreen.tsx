// components/day/DayEntryScreen.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { TodayHeader } from '../today/TodayHeader';
import {
  TodaySummary,
  TodaySummaryCard,
} from '../today/TodaySummaryCard';
import { Timeline } from '../today/TodayTimeline';

import { MedicationModal } from '../medication/MedicationModal';
import ActivityModal from '../today/ActivityModal';
import MoodModal from '../today/MoodModal';
import NoteModal from '../today/NoteModal';
import SleepModal from '../today/SleepModal';
import SymptomModal from '../today/SymptomModal';
import WakeModal from '../today/WakeModal';

import { useActivityModal } from '../../hooks/useActivityModal';
import { useDayEvents } from '../../hooks/useDayEvents';
import { useMedicationModal } from '../../hooks/useMedicationModal';
import { useMedicationSettings } from '../../hooks/useMedicationSettings';
import { useMoodModal } from '../../hooks/useMoodModal';
import { useNoteModal, type NoteModalMode } from '../../hooks/useNoteModal';
import { useSleepModal } from '../../hooks/useSleepModal';
import {
  useSymptomModal,
  type SymptomModalMode,
} from '../../hooks/useSymptomModal';
import { useWakeModal } from '../../hooks/useWakeModal';

import { loadEntryForDate } from '../../src/storage/serenoteStorage';
import { useTheme } from '../../src/theme/useTheme';
import type { DateKey, SerenoteEntry } from '../../src/types/serenote';
import type { TimelineEvent } from '../../src/types/timeline';

// 🆕 その日の最初の起動判定フック
import { useDailyMoodPrompt } from '../../hooks/useDailyMoodPrompt';
// 🆕 サブスクリプション情報
import { useSubscription } from '../../src/subscription/useSubscription';

// 🆕 日付ユーティリティ
import { getNextDateKey, getPrevDateKey } from '../../src/utils/dateKey';

// 🆕 気分ユーティリティ（-2〜+2 を 1〜5 に正規化してラベル・絵文字化）
import {
  moodValueToEmoji,
  moodValueToLabel,
  normalizeMoodValue,
} from '../../src/utils/mood';

type Props = {
  dateKey: DateKey;
  headerLabel: string;
  // 🆕 History 詳細画面などから日付を切り替えたいときだけ渡す
  onChangeDate?: (nextKey: DateKey) => void;
};

// 🆕 Free 版の 1 日あたり気分記録上限
const FREE_MOOD_LIMIT_PER_DAY = 2;

export const DayEntryScreen: React.FC<Props> = ({
  dateKey,
  headerLabel,
  onChangeDate,
}) => {
  const { theme } = useTheme();
  const { isPro, openProPaywall } = useSubscription();

  // 指定日付のイベント + 構造化エントリ
  const { entry, events, setEvents, loaded } = useDayEvents(dateKey, {
    initialEvents: [],
  });

  // ユーザーのお薬マスタ
  const { loaded: medsLoaded, medList } = useMedicationSettings();

  // ⭐ 編集中のイベントたち
  const [editingMoodEvent, setEditingMoodEvent] =
    useState<TimelineEvent | null>(null);
  const [editingActivityEvent, setEditingActivityEvent] =
    useState<TimelineEvent | null>(null);
  const [editingWakeEvent, setEditingWakeEvent] =
    useState<TimelineEvent | null>(null);
  const [editingSleepEvent, setEditingSleepEvent] =
    useState<TimelineEvent | null>(null);
  const [editingMedEvent, setEditingMedEvent] =
    useState<TimelineEvent | null>(null);
  const [editingSymptomEvent, setEditingSymptomEvent] =
    useState<TimelineEvent | null>(null);

  // 💤 前日のエントリ（睡眠サマリー用）
  const [prevEntry, setPrevEntry] = useState<SerenoteEntry | null>(null);

  // ✅ 保存トースト用 state
  const [savedFlashVisible, setSavedFlashVisible] = useState(false);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSavedFlash = () => {
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }
    setSavedFlashVisible(true);
    flashTimeoutRef.current = setTimeout(() => {
      setSavedFlashVisible(false);
    }, 1600);
  };

  // アンマウント時にタイマーをクリア
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  // 前日のエントリ読込
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const prevKey = getPrevDateKey(dateKey as DateKey);
        const e = await loadEntryForDate(prevKey);
        if (!cancelled) {
          setPrevEntry(e ?? null);
        }
      } catch (e) {
        if (!cancelled) {
          setPrevEntry(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  // タイムラインは時刻順にソートして表示
  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) =>
        a.time < b.time ? -1 : a.time > b.time ? 1 : 0
      ),
    [events]
  );

  // 🧮 当日の気分イベント数（Free 制限用）
  const moodEventCount = useMemo(
    () => events.filter(e => e.type === 'mood').length,
    [events]
  );

  // 💊 お薬モーダル
  const medModal = useMedicationModal(medList ?? []);

  // 🌅 起床
  const wakeModal = useWakeModal();
  // 🌙 就寝
  const sleepModal = useSleepModal();
  // 🙂 気分（-2〜+2）
  const moodModal = useMoodModal();
  // 🏃 行動
  const activityModal = useActivityModal();
  // 📝 メモ（create / edit 両対応）
  const noteModal = useNoteModal();
  // 😟 症状
  const symptomModal = useSymptomModal();

  // 🆕 「その日の最初の起動かどうか」をチェックするフック
  const { shouldAutoOpenMood, setShouldAutoOpenMood } =
    useDailyMoodPrompt(dateKey);

  // 🆕 今日の最初の起動だったら、気分モーダルを自動オープン
  //    ただし Free で既に 2 件以上ある場合は開かない
  useEffect(() => {
    if (!shouldAutoOpenMood) return;
    if (!loaded) return;

    // Free 限定ユーザーで上限を越えていたら自動オープンをスキップ
    if (!isPro && moodEventCount >= FREE_MOOD_LIMIT_PER_DAY) {
      setShouldAutoOpenMood(false);
      return;
    }

    setEditingMoodEvent(null);
    // 中立 0 からスタート（-2〜+2）
    moodModal.setMood(0);
    moodModal.setMemoText('');
    moodModal.setTimeText('');
    moodModal.openModal();

    setShouldAutoOpenMood(false);
  }, [
    shouldAutoOpenMood,
    loaded,
    isPro,
    moodEventCount,
    moodModal,
    setShouldAutoOpenMood,
  ]);

  // 🔎 Summary を SerenoteEntry から作る（睡眠は前日も見る）
  const todaySummary: TodaySummary = useMemo(() => {
    if (!entry) {
      return {
        sleep: '—',
        meds: '—',
        mood: '—',
        activities: '—',
      };
    }

    // 気分（entry.mood.value は -2〜+2 / 1〜5 どちらでも OK として受ける）
    let moodDisplay = '—';
    const normalized = normalizeMoodValue(entry.mood?.value);
    if (normalized != null) {
      const label = moodValueToLabel(normalized);
      const emoji = moodValueToEmoji(normalized);
      moodDisplay = `${emoji} ${label}`;
    }

    // 睡眠（前日 bedTime → 当日 wakeTime 優先）
    let sleepLabel = '—';
    const bedFromPrev = prevEntry?.sleep?.bedTime ?? null;
    const bedFromSame = entry.sleep?.bedTime ?? null;
    const wake = entry.sleep?.wakeTime ?? null;

    if (bedFromPrev || bedFromSame || wake) {
      const bed = bedFromPrev ?? bedFromSame ?? '不明';
      const wakeLabel = wake ?? '不明';
      sleepLabel = `${bed} → ${wakeLabel}`;
    }

    // 服薬
    const medsCount = entry.medications?.length ?? 0;
    const medsLabel = medsCount === 0 ? '—' : `${medsCount} 回 記録`;

    // 行動（症状 + メモ件数）
    const symptomCount = entry.symptoms?.length ?? 0;
    const noteCount = entry.notes?.length ?? 0;
    const actTotal = symptomCount + noteCount;
    const activitiesLabel = actTotal === 0 ? '—' : `${actTotal} 件 記録`;

    return {
      sleep: sleepLabel,
      meds: medsLabel,
      mood: moodDisplay,
      activities: activitiesLabel,
    };
  }, [entry, prevEntry]);

  // ⭐ 気分: 新規 or 編集
  const handleAddOrUpdateMood = (event: TimelineEvent) => {
    setEvents(prev => {
      if (editingMoodEvent) {
        // 既存レコードの編集は制限なし
        return prev.map(e =>
          e.id === editingMoodEvent.id
            ? { ...event, id: editingMoodEvent.id }
            : e
        );
      }
      // 新規追加のときだけ、実際の制限は「モーダルを開く前」にやっているのでここではそのまま追加
      return [...prev, event];
    });
    setEditingMoodEvent(null);
    showSavedFlash();
  };

  // ⭐ 行動: 新規 or 編集
  const handleAddOrUpdateActivity = (event: TimelineEvent) => {
    setEvents(prev => {
      if (editingActivityEvent && editingActivityEvent.type === 'activity') {
        return prev.map(e =>
          e.id === editingActivityEvent.id
            ? { ...event, id: editingActivityEvent.id }
            : e
        );
      }
      return [...prev, event];
    });
    setEditingActivityEvent(null);
    showSavedFlash();
  };

  // ⭐ 起床: 新規 or 編集
  const handleAddOrUpdateWake = (event: TimelineEvent) => {
    setEvents(prev => {
      if (editingWakeEvent && editingWakeEvent.type === 'wake') {
        return prev.map(e =>
          e.id === editingWakeEvent.id
            ? { ...event, id: editingWakeEvent.id }
            : e
        );
      }
      return [...prev, event];
    });
    setEditingWakeEvent(null);
    showSavedFlash();
  };

  // ⭐ 就寝: 新規 or 編集
  const handleAddOrUpdateSleep = (event: TimelineEvent) => {
    setEvents(prev => {
      if (editingSleepEvent && editingSleepEvent.type === 'sleep') {
        return prev.map(e =>
          e.id === editingSleepEvent.id
            ? { ...event, id: editingSleepEvent.id }
            : e
        );
      }
      return [...prev, event];
    });
    setEditingSleepEvent(null);
    showSavedFlash();
  };

  // ⭐ 薬: 新規 or 編集
  const handleAddOrUpdateMed = (event: TimelineEvent) => {
    setEvents(prev => {
      if (editingMedEvent && editingMedEvent.type === 'med') {
        return prev.map(e =>
          e.id === editingMedEvent.id
            ? { ...event, id: editingMedEvent.id }
            : e
        );
      }
      return [...prev, event];
    });
    setEditingMedEvent(null);
    showSavedFlash();
  };

  // ⭐ ノート: 新規 or 編集
  const handleUpsertNoteEvent = (
    event: TimelineEvent,
    mode: NoteModalMode
  ) => {
    setEvents(prev => {
      if (mode === 'edit') {
        return prev.map(e => (e.id === event.id ? event : e));
      }
      return [...prev, event];
    });
    showSavedFlash();
  };

  // ⭐ 症状: 新規 or 編集
  const handleAddOrUpdateSymptom = (
    event: TimelineEvent,
    mode: SymptomModalMode
  ) => {
    setEvents(prev => {
      if (mode === 'edit') {
        return prev.map(e =>
          e.id === event.id
            ? {
                ...e,
                ...event,
              }
            : e
        );
      }

      const newSymptom: TimelineEvent = {
        ...event,
        type: 'symptom',
        planned: event.planned ?? false,
        forDoctor: event.forDoctor ?? false,
      };

      return [...prev, newSymptom];
    });

    setEditingSymptomEvent(null);
    showSavedFlash();
  };

  // ⭐ 症状プリセット: 長押しで即保存
  const handleQuickPresetSymptom = (payload: {
    label: string;
    memo: string;
    time: string;
    forDoctor: boolean;
    tag?: unknown;
  }) => {
    const { label, memo, time, forDoctor } = payload;

    setEvents(prev => {
      const newEvent: TimelineEvent = {
        id:
          typeof globalThis !== 'undefined' &&
          (globalThis as any).crypto &&
          typeof (globalThis as any).crypto.randomUUID === 'function'
            ? (globalThis as any).crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'symptom',
        label,
        memo,
        time,
        forDoctor,
        planned: false,
      };
      return [...prev, newEvent];
    });

    setEditingSymptomEvent(null);
    showSavedFlash();
    symptomModal.closeModal();
  };

  // 「＋起床」ボタン → 新規モード
  const handlePressAddWake = () => {
    setEditingWakeEvent(null);
    wakeModal.setTimeText('');
    wakeModal.setMemoText('');
    wakeModal.openModal();
  };

  // 「＋就寝」ボタン → 新規モード
  const handlePressAddSleep = () => {
    setEditingSleepEvent(null);
    sleepModal.setTimeText('');
    sleepModal.setMemoText('');
    sleepModal.openModal();
  };

  // 「＋薬」ボタン → 新規モード
  const handlePressAddMed = () => {
    setEditingMedEvent(null);
    medModal.openModal('morning', null);
  };

  // 「＋気分」ボタン → 新規モード（Free / Pro 制限）
  const handlePressAddMood = () => {
    if (!isPro && moodEventCount >= FREE_MOOD_LIMIT_PER_DAY) {
      Alert.alert(
        'SereNote Pro',
        `無料版では、1日に記録できる「気分」は最大 ${FREE_MOOD_LIMIT_PER_DAY} 件までです。\n\n` +
          'より細かく一日の中の気分の変化を記録したい場合は、SereNote Pro のご利用をご検討ください。',
        [
          { text: '閉じる', style: 'cancel' },
          {
            text: 'Pro について',
            onPress: () => {
              openProPaywall();
            },
          },
        ]
      );
      return;
    }

    setEditingMoodEvent(null);
    // 新規は 0（ふつう）から
    moodModal.setMood(0);
    moodModal.setMemoText('');
    moodModal.setTimeText('');
    moodModal.openModal();
  };

  // 「＋行動」ボタン → 新規モード
  const handlePressAddActivity = () => {
    setEditingActivityEvent(null);
    activityModal.openModal();
  };

  // 「＋メモ」ボタン → 新規モード
  const handlePressAddNote = () => {
    noteModal.openForCreate();
  };

  // 「＋症状」ボタン → 新規モード
  const handlePressAddSymptom = () => {
    setEditingSymptomEvent(null);
    symptomModal.openModal();
  };

  // 「イベントを追加する」アクションシート
  const openAddEventSheet = () => {
    const options = [
      '起床',
      '就寝',
      'お薬',
      '気分',
      '行動',
      'メモ',
      '症状',
      'キャンセル',
    ];
    const cancelButtonIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        buttonIndex => {
          switch (buttonIndex) {
            case 0:
              handlePressAddWake();
              break;
            case 1:
              handlePressAddSleep();
              break;
            case 2:
              handlePressAddMed();
              break;
            case 3:
              handlePressAddMood();
              break;
            case 4:
              handlePressAddActivity();
              break;
            case 5:
              handlePressAddNote();
              break;
            case 6:
              handlePressAddSymptom();
              break;
            default:
              break;
          }
        }
      );
    } else {
      Alert.alert('イベントを追加', undefined, [
        { text: '起床', onPress: handlePressAddWake },
        { text: '就寝', onPress: handlePressAddSleep },
        { text: 'お薬', onPress: handlePressAddMed },
        { text: '気分', onPress: handlePressAddMood },
        { text: '行動', onPress: handlePressAddActivity },
        { text: 'メモ', onPress: handlePressAddNote },
        { text: '症状', onPress: handlePressAddSymptom },
        { text: 'キャンセル', style: 'cancel' },
      ]);
    }
  };

  // ⏳ 読み込み中
  if (!loaded || !medsLoaded) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // 🧱 UI
  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.container}>
        {/* 🆕 前日 / 翌日ナビつきヘッダー */}
        <View style={styles.headerRow}>
          {onChangeDate ? (
            <TouchableOpacity
              style={styles.headerNavButton}
              onPress={() => onChangeDate(getPrevDateKey(dateKey))}
            >
              <Text
                style={[
                  styles.headerNavText,
                  { color: theme.colors.textSub },
                ]}
              >
                ＜ 前の日
              </Text>
            </TouchableOpacity>
          ) : (
            // Todayタブ用：左右のバランスを保つためのダミー
            <View style={styles.headerNavButtonPlaceholder} />
          )}

          <View style={styles.headerCenter}>
            <TodayHeader dateLabel={headerLabel} />
          </View>

          {onChangeDate ? (
            <TouchableOpacity
              style={styles.headerNavButton}
              onPress={() => onChangeDate(getNextDateKey(dateKey))}
            >
              <Text
                style={[
                  styles.headerNavText,
                  { color: theme.colors.textSub },
                ]}
              >
                翌日 ＞
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerNavButtonPlaceholder} />
          )}
        </View>

        <TodaySummaryCard summary={todaySummary} />

        {/* サマリーの下に 1 ボタン */}
        <TouchableOpacity
          style={[
            styles.addEventButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={openAddEventSheet}
        >
          <Text style={styles.addEventButtonText}>
            イベントを追加する
          </Text>
        </TouchableOpacity>

        <Timeline
          events={sortedEvents}
          onLongPressEvent={handleLongPressEvent}
        />
      </View>

      {/* ✅ 保存トースト */}
      {savedFlashVisible && (
        <View
          pointerEvents="none"
          style={[
            styles.savedToast,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.borderSoft,
            },
          ]}
        >
          <Text
            style={[
              styles.savedToastText,
              { color: theme.colors.textMain },
            ]}
          >
            ✅ 保存しました
          </Text>
        </View>
      )}

      {/* 💊 お薬 */}
      <MedicationModal
        visible={medModal.visible}
        onRequestClose={() => {
          medModal.closeModal();
          setEditingMedEvent(null);
        }}
        onConfirm={() => medModal.confirmAndCreateEvent(handleAddOrUpdateMed)}
        medList={medList ?? []}
        selectedMedType={medModal.selectedMedType}
        setSelectedMedType={medModal.setSelectedMedType}
        selectedMedId={medModal.selectedMedId}
        setSelectedMedId={medModal.setSelectedMedId}
        timeMode={medModal.timeMode}
        setTimeMode={medModal.setTimeMode}
        manualTime={medModal.manualTime}
        setManualTime={medModal.setManualTime}
        customMedName={medModal.customMedName}
        setCustomMedName={medModal.setCustomMedName}
        dosageText={medModal.dosageText}
        setDosageText={medModal.setDosageText}
        memoText={medModal.memoText}
        setMemoText={medModal.setMemoText}
        linkToReminder={medModal.linkToReminder}
        setLinkToReminder={medModal.setLinkToReminder}
      />

      {/* 🌅 起床 */}
      <WakeModal
        visible={wakeModal.visible}
        onRequestClose={() => {
          wakeModal.closeModal();
          setEditingWakeEvent(null);
        }}
        onConfirm={() => wakeModal.confirmAndCreateEvent(handleAddOrUpdateWake)}
        timeText={wakeModal.timeText}
        setTimeText={wakeModal.setTimeText}
        memoText={wakeModal.memoText}
        setMemoText={wakeModal.setMemoText}
        mode={editingWakeEvent ? 'edit' : 'create'}
      />

      {/* 🌙 就寝 */}
      <SleepModal
        visible={sleepModal.visible}
        onRequestClose={() => {
          sleepModal.closeModal();
          setEditingSleepEvent(null);
        }}
        onConfirm={() =>
          sleepModal.confirmAndCreateEvent(handleAddOrUpdateSleep)
        }
        timeText={sleepModal.timeText}
        setTimeText={sleepModal.setTimeText}
        memoText={sleepModal.memoText}
        setMemoText={sleepModal.setMemoText}
        mode={editingSleepEvent ? 'edit' : 'create'}
      />

      {/* 🙂 気分 */}
      <MoodModal
        visible={moodModal.visible}
        onRequestClose={() => {
          moodModal.closeModal();
          setEditingMoodEvent(null);
        }}
        onConfirm={() =>
          moodModal.confirmAndCreateEvent(handleAddOrUpdateMood)
        }
        mood={moodModal.mood}
        setMood={moodModal.setMood}
        memoText={moodModal.memoText}
        setMemoText={moodModal.setMemoText}
        timeText={moodModal.timeText}
        setTimeText={moodModal.setTimeText}
      />

      {/* 🏃 行動 */}
      <ActivityModal
        visible={activityModal.visible}
        onRequestClose={() => {
          activityModal.closeModal();
          setEditingActivityEvent(null);
        }}
        onConfirm={() =>
          activityModal.confirmAndSubmit(handleAddOrUpdateActivity)
        }
        category={activityModal.category}
        setCategory={activityModal.setCategory}
        labelText={activityModal.labelText}
        setLabelText={activityModal.setLabelText}
        memoText={activityModal.memoText}
        setMemoText={activityModal.setMemoText}
        timeText={activityModal.timeText}
        setTimeText={activityModal.setTimeText}
        endTimeText={activityModal.endTimeText}
        setEndTimeText={activityModal.setEndTimeText}
        mode={activityModal.mode}
      />

      {/* 📝 メモ */}
      <NoteModal
        visible={noteModal.visible}
        mode={noteModal.mode}
        onRequestClose={noteModal.closeModal}
        onConfirm={() => noteModal.confirmAndSubmit(handleUpsertNoteEvent)}
        noteText={noteModal.noteText}
        setNoteText={noteModal.setNoteText}
        timeText={noteModal.timeText}
        setTimeText={noteModal.setTimeText}
      />

      {/* 😟 症状 */}
      <SymptomModal
        visible={symptomModal.visible}
        mode={symptomModal.mode}
        onRequestClose={symptomModal.closeModal}
        onConfirm={() =>
          symptomModal.confirmAndSubmit(handleAddOrUpdateSymptom)
        }
        onQuickPresetConfirm={handleQuickPresetSymptom}
        labelText={symptomModal.labelText}
        setLabelText={symptomModal.setLabelText}
        memoText={symptomModal.memoText}
        setMemoText={symptomModal.setMemoText}
        timeText={symptomModal.timeText}
        setTimeText={symptomModal.setTimeText}
        forDoctor={symptomModal.forDoctor}
        setForDoctor={symptomModal.setForDoctor}
      />
    </SafeAreaView>
  );

  // ⬇️ タイムライン長押し → 編集 / 削除
  function handleLongPressEvent(event: TimelineEvent) {
    Alert.alert(
      'この記録',
      event.label,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            setEvents(prev => prev.filter(e => e.id !== event.id));
          },
        },
        {
          text: '編集',
          onPress: () => {
            switch (event.type) {
              case 'note':
                noteModal.openForEdit(event);
                break;

              case 'mood': {
                setEditingMoodEvent(event);
                moodModal.setMemoText(event.memo ?? '');
                moodModal.setTimeText(event.time || '');

                const anyEvent = event as any;

                // 🆕 1) 新仕様: moodValue(-2〜+2) を優先
                if (typeof anyEvent.moodValue === 'number') {
                  const raw = anyEvent.moodValue as number;
                  const clamped = Math.max(-2, Math.min(2, raw));
                  moodModal.setMood(clamped as any);
                }
                // 2) 旧仕様の moodScore(1〜5 想定) があれば変換
                else if (typeof anyEvent.moodScore === 'number') {
                  const score = anyEvent.moodScore as number; // 1〜5
                  const centered = score - 3; // 1→-2, 2→-1, 3→0, 4→1, 5→2
                  const clamped = Math.max(-2, Math.min(2, centered));
                  moodModal.setMood(clamped as any);
                }
                // 3) それもない場合は label からの後方互換
                else {
                  switch (event.label) {
                    case 'とてもつらい':
                      moodModal.setMood(-2);
                      break;
                    case 'つらい':
                      moodModal.setMood(-1);
                      break;
                    case 'ふつう':
                      moodModal.setMood(0);
                      break;
                    case '少し良い':
                      moodModal.setMood(1);
                      break;
                    case 'とても良い':
                      moodModal.setMood(2);
                      break;
                    default:
                      moodModal.setMood(0);
                  }
                }

                moodModal.openModal();
                break;
              }

              case 'activity':
                setEditingActivityEvent(event);
                activityModal.openForEdit(event);
                break;

              case 'wake':
                setEditingWakeEvent(event);
                wakeModal.setTimeText(event.time);
                wakeModal.setMemoText(event.memo ?? '');
                wakeModal.openModal();
                break;

              case 'sleep':
                setEditingSleepEvent(event);
                sleepModal.setTimeText(event.time);
                sleepModal.setMemoText(event.memo ?? '');
                sleepModal.openModal();
                break;

              case 'med':
                setEditingMedEvent(event);
                medModal.setSelectedMedType(
                  event.medTimeSlot ?? 'morning'
                );
                medModal.setSelectedMedId(event.medId ?? null);
                medModal.setDosageText(event.dosageText ?? '');
                medModal.setMemoText(event.memo ?? '');
                medModal.openModal(
                  event.medTimeSlot ?? 'morning',
                  event.medId ?? null
                );
                break;

              case 'symptom':
                setEditingSymptomEvent(event);
                symptomModal.openForEdit(event);
                break;

              default:
                break;
            }
          },
        },
      ],
      { cancelable: true }
    );
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 🆕 ヘッダー行（＜ 前の日 | 日付 | 翌日 ＞）
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerNavButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    minWidth: 70,
  },
  headerNavButtonPlaceholder: {
    minWidth: 70,
  },
  headerNavText: {
    fontSize: 11,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  addEventButton: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addEventButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  savedToast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  savedToastText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

// ファイルのいちばん下に追加
export default DayEntryScreen;