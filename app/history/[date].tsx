// app/history/[date].tsx
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { DayEntryScreen } from '../../components/day/DayEntryScreen';
import { getTodayKey } from '../../hooks/useDayEvents';
import type { DateKey } from '../../src/types/serenote';

export default function HistoryDetailScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const paramDate = params.date;

  const dateKey: DateKey =
    typeof paramDate === 'string' && paramDate.length > 0
      ? (paramDate as DateKey)
      : getTodayKey(); // 保険として今日をフォールバック

  return (
    <DayEntryScreen
      dateKey={dateKey}
      headerLabel={`${dateKey} の記録`}
    />
  );
}