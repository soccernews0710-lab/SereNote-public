import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,      // ← 全タブのヘッダーを非表示
        tabBarLabelStyle: { fontSize: 11 },
        tabBarStyle: {
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          headerShown: false,
          tabBarIcon: () => <Text>🕒</Text>,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerShown: false,
          tabBarIcon: () => <Text>📅</Text>,
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          headerShown: false,
          tabBarIcon: () => <Text>📊</Text>,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: () => <Text>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}