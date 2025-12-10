import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 2,
        },
        tabBarStyle: {
          height: 74,          // ← 高さを少し増やす
          paddingTop: 6,
          paddingBottom: 12,   // ← これが超重要
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🕒</Text>,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>📅</Text>,
        }}
      />

      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          headerShown: false,
          tabBarIcon: () => <Text>🌱</Text>, // 好きな絵文字に変えてOK
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>📊</Text>,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}