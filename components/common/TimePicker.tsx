// components/common/TimePicker.tsx
import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  // "HH:MM" 形式（例: "08:10"）
  value: string;
  onChange: (next: string) => void;
};

// "00"〜"23"
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, '0')
);
// "00"〜"59"
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, '0')
);

// "HH:MM" → [hourStr, minuteStr]
// 空 or 変な値なら「現在時刻」
const parseTime = (value: string): [string, string] => {
  const now = new Date();

  if (!value) {
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    return [hh, mm];
  }

  const [hStr, mStr] = value.split(':');
  const h = Number(hStr);
  const m = Number(mStr);

  const valid =
    !Number.isNaN(h) &&
    !Number.isNaN(m) &&
    h >= 0 &&
    h < 24 &&
    m >= 0 &&
    m < 60;

  if (!valid) {
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    return [hh, mm];
  }

  return [
    h.toString().padStart(2, '0'),
    m.toString().padStart(2, '0'),
  ];
};

export const TimePicker: React.FC<Props> = ({ value, onChange }) => {
  const [hour, minute] = parseTime(value);

  const handleHourChange = (nextHour: string) => {
    onChange(`${nextHour}:${minute}`);
  };

  const handleMinuteChange = (nextMinute: string) => {
    onChange(`${hour}:${nextMinute}`);
  };

  return (
    <View style={styles.wrapper}>
      {/* 時 */}
      <View style={styles.column}>
        <Text style={styles.label}>時</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={hour}
            onValueChange={v => handleHourChange(v as string)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {HOURS.map(h => (
              <Picker.Item key={h} label={h} value={h} />
            ))}
          </Picker>
        </View>
      </View>

      {/* 分 */}
      <View style={styles.column}>
        <Text style={styles.label}>分</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={minute}
            onValueChange={v => handleMinuteChange(v as string)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {MINUTES.map(m => (
              <Picker.Item key={m} label={m} value={m} />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );
};

export default TimePicker;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  column: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 12,
    color: '#777',
    marginBottom: 4,
  },
  pickerContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    height: 160,
    width: '100%',
  },
  pickerItem: {
    fontSize: 18,
    color: '#111', // ← 文字色を明示的に黒にする
  },
});