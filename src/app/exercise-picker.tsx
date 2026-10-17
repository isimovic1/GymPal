import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExerciseBrowser } from '../components/ExerciseBrowser';
import { Button } from '../components/ui';
import { setPickResult, useExerciseUsage, useExercises } from '../lib/workout';
import { colors, spacing } from '../theme';

export default function ExercisePicker() {
  const ex = useExercises();
  // Keep selection order so exercises are added in the order they were tapped.
  const [picked, setPicked] = useState<string[]>([]);
  const selected = useMemo(() => new Set(picked), [picked]);
  const usage = useExerciseUsage();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ExerciseBrowser
        exercises={ex.all}
        selected={selected}
        usageCount={usage}
        onPress={(e) => setPicked((cur) => (cur.includes(e.id) ? cur.filter((x) => x !== e.id) : [...cur, e.id]))}
        footer={<Button title="+ Napravi vlastitu vježbu" variant="ghost" onPress={() => router.push('/create-exercise')} />}
      />
      <View style={{ position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.xl }}>
        <Button
          title={picked.length ? `Dodaj (${picked.length})` : 'Odaberi vježbe'}
          disabled={!picked.length}
          onPress={() => {
            setPickResult(picked);
            router.back();
          }}
        />
      </View>
    </SafeAreaView>
  );
}
