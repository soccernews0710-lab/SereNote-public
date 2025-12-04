// components/today/TodayBottomActions.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  onAddWakePress: () => void;
  onAddSleepPress: () => void;
  onAddMedicationPress: () => void;
  onAddMoodPress: () => void;
  onAddActivityPress: () => void;
  onAddNotePress: () => void;
};

export const TodayBottomActions: React.FC<Props> = ({
  onAddWakePress,
  onAddSleepPress,
  onAddMedicationPress,
  onAddMoodPress,
  onAddActivityPress,
  onAddNotePress,
}) => {
  const renderButton = (label: string, emoji: string, onPress: () => void) => (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>
        {emoji} {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {renderButton('起床', '🌅', onAddWakePress)}
        {renderButton('就寝', '🌙', onAddSleepPress)}
        {renderButton('お薬', '💊', onAddMedicationPress)}
      </View>
      <View style={[styles.row, { marginTop: 8 }]}>
        {renderButton('気分', '🙂', onAddMoodPress)}
        {renderButton('行動', '🏃‍♂️', onAddActivityPress)}
        {renderButton('メモ', '📝', onAddNotePress)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 13,
  },
});