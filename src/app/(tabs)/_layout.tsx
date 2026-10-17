import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/tabs';
import { ColorValue } from 'react-native';

import { colors } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const icon = (name: IconName) => ({ color, size }: { color: ColorValue; size: number }) => (
  <Ionicons name={name} color={color as string} size={size} />
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Trening', tabBarIcon: icon('barbell-outline') }} />
      <Tabs.Screen name="history" options={{ title: 'Povijest', tabBarIcon: icon('time-outline') }} />
      <Tabs.Screen name="exercises" options={{ title: 'Vježbe', tabBarIcon: icon('list-outline') }} />
      <Tabs.Screen name="stats" options={{ title: 'Statistika', tabBarIcon: icon('stats-chart-outline') }} />
    </Tabs>
  );
}
