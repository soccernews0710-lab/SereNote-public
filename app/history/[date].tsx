import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';

import DayEntryScreen from '../../components/day/DayEntryScreen';
import type { DateKey } from '../../src/types/serenote';

// "YYYY-MM-DD" → "M月D日（曜）"
function formatHeaderLabel(dateKey: DateKey): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;

  const date = new Date(y, m - 1, d);
  const week = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${m}月${d}日（${week}）`;
}

export default function HistoryDetailScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const router = useRouter();

  if (!date) return null;

  const dateKey = date as DateKey;

  const headerLabel = useMemo(
    () => formatHeaderLabel(dateKey),
    [dateKey]
  );

  const handleChangeDate = (nextKey: DateKey) => {
    router.replace(`/history/${nextKey}`);
  };

  return (
    <DayEntryScreen
      dateKey={dateKey}
      headerLabel={headerLabel}
      onChangeDate={handleChangeDate}
    />
  );
}