// app/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

import { MedicationSettingsProvider } from '../hooks/useMedicationSettings';
import { AppGate } from '../src/privacy/AppGate';
import { PrivacyLockProvider } from '../src/privacy/usePrivacyLock';
import { SubscriptionProvider } from '../src/subscription/useSubscription';
import { ThemeProvider } from '../src/theme/ThemeProvider';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <MedicationSettingsProvider>
        <SubscriptionProvider>
          <PrivacyLockProvider>
            {/* 👇 ここでロック判定を挟む */}
            <AppGate>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen
                  name="index"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="(tabs)"
                  options={{ headerShown: false }}
                />
              </Stack>
            </AppGate>
          </PrivacyLockProvider>
        </SubscriptionProvider>
      </MedicationSettingsProvider>
    </ThemeProvider>
  );
}