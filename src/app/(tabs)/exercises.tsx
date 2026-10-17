import { router } from 'expo-router';

import { ExerciseBrowser } from '../../components/ExerciseBrowser';
import { Button } from '../../components/ui';
import { useExerciseUsage, useExercises } from '../../lib/workout';

export default function Exercises() {
  const ex = useExercises();
  const usage = useExerciseUsage();

  return (
    <ExerciseBrowser
      exercises={ex.all}
      usageCount={usage}
      onPress={(e) => router.push({ pathname: '/exercise', params: { id: e.id } })}
      footer={<Button title="+ Napravi vlastitu vježbu" variant="ghost" onPress={() => router.push('/create-exercise')} />}
    />
  );
}
