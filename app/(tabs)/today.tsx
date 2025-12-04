// app/(tabs)/today.tsx
import React from 'react';
import { DayEntryScreen } from '../../components/day/DayEntryScreen';
import { getTodayKey } from '../../hooks/useDayEvents';
import type { DateKey } from '../../src/types/serenote';

export default function TodayScreen() {
  const todayKey: DateKey = getTodayKey();

  return (
    <DayEntryScreen
      dateKey={todayKey}
      headerLabel={`${todayKey}（今日）`}
    />
  );
}