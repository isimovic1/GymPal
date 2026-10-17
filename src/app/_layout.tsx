import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider, useStore } from '../lib/store';
import { colors } from '../theme';

function RootNavigator() {
  const { ready } = useStore();
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerTintColor: colors.primary, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="workout" options={{ title: 'Trening', gestureEnabled: false }} />
      <Stack.Screen name="routine-edit" options={{ title: 'Rutina' }} />
      <Stack.Screen name="exercise-picker" options={{ title: 'Dodaj vježbe', presentation: 'modal' }} />
      <Stack.Screen name="exercise" options={{ title: 'Vježba' }} />
      <Stack.Screen name="workout-detail" options={{ title: 'Trening' }} />
      <Stack.Screen name="create-exercise" options={{ title: 'Nova vježba', presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
