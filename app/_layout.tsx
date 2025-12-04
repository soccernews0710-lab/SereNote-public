// app/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';
import { MedicationSettingsProvider } from '../hooks/useMedicationSettings';
import { ThemeProvider } from '../src/theme/ThemeProvider'; // or './ThemeProvider'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <MedicationSettingsProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </MedicationSettingsProvider>
    </ThemeProvider>
  );
}