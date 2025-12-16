// app/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

import { MedicationSettingsProvider } from '../hooks/useMedicationSettings';
import { AuthGate } from '../src/auth/AuthGate';
import { OnboardingGate } from '../src/onboarding/OnboardingGate';
import { AppGate } from '../src/privacy/AppGate';
import { PrivacyLockProvider } from '../src/privacy/usePrivacyLock';
import { SubscriptionProvider } from '../src/subscription/useSubscription';
import { ThemeProvider } from '../src/theme/ThemeProvider';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthGate>
        <OnboardingGate>
          <MedicationSettingsProvider>
            <SubscriptionProvider>
              <PrivacyLockProvider>
                <AppGate>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(tabs)" />
                    {/* ✅ Onboarding */}
                    <Stack.Screen name="onboarding/profile" />
                  </Stack>
                </AppGate>
              </PrivacyLockProvider>
            </SubscriptionProvider>
          </MedicationSettingsProvider>
        </OnboardingGate>
      </AuthGate>
    </ThemeProvider>
  );
}