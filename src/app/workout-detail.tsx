import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

import { ExerciseThumb } from '../components/ExerciseItem';
import { fmtKg } from '../components/SetRow';
import { Button, Card, Row, Screen, styles } from '../components/ui';
import { durationMs, findPRs, formatDurationShort, workingSets, workoutSetCount, workoutVolume } from '../lib/stats';
import { newId, useStore } from '../lib/store';
import { useExercises, workoutFromPast } from '../lib/workout';
import { colors, spacing } from '../theme';

const PR_LABEL = { weight: 'najveća težina', e1rm: 'proc. 1RM', volume: 'volumen' } as const;

export default function WorkoutDetail() {
  const { id, summary } = useLocalSearchParams<{ id: string; summary?: string }>();
  const { state, deleteWorkout, setActive, saveRoutine } = useStore();
  const ex = useExercises();
  const w = state.workouts.find((x) => x.id === id);

  if (!w) {
    return (
      <Screen>
        <Text style={styles.muted}>Trening nije pronađen.</Text>
      </Screen>
    );
  }

  const prs = findPRs(w, state.workouts);
  const date = new Date(w.startedAt);

  const repeat = () => {
    const start = () => {
      setActive(workoutFromPast(w, state.settings.defaultRestSec));
      router.push('/workout');
    };
    if (state.active) {
      Alert.alert('Trening je već u tijeku', 'Odbaciti ga i započeti ovaj?', [
        { text: 'Odustani', style: 'cancel' },
        { text: 'Započni', style: 'destructive', onPress: start },
      ]);
    } else start();
  };

  const saveAsRoutine = () => {
    saveRoutine({
      id: newId(),
      name: w.name,
      createdAt: new Date().toISOString(),
      exercises: w.exercises.map((e) => ({ exerciseId: e.exerciseId, restSec: e.restSec, sets: e.sets.length })),
    });
    Alert.alert('Spremljeno', `Rutina "${w.name}" je dodana.`);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: summary ? 'Bravo! 💪' : w.name }} />
      {summary && (
        <View style={{ backgroundColor: colors.success, borderRadius: 16, padding: spacing.lg, gap: 4 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>Trening završen!</Text>
          <Text style={{ color: '#fff' }}>
            {prs.length ? `Novi rekordi: ${prs.length} 🏆` : 'Odlično odrađeno, vidimo se na sljedećem treningu.'}
          </Text>
        </View>
      )}

      <Card>
        <Text style={{ fontSize: 19, fontWeight: '800', color: colors.text }}>{w.name}</Text>
        <Text style={styles.muted}>
          {date.toLocaleDateString('hr-HR', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
          {date.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Row style={{ marginTop: spacing.xs }}>
          <Big label="Trajanje" value={formatDurationShort(durationMs(w))} />
          <Big label="Volumen" value={`${Math.round(workoutVolume(w))} kg`} />
          <Big label="Serije" value={String(workoutSetCount(w))} />
        </Row>
      </Card>

      {prs.length > 0 && (
        <Card title="Rekordi 🏆">
          {prs.map((p, i) => (
            <Text key={i} style={styles.text}>
              {ex.name(p.exerciseId)}: {PR_LABEL[p.kind]} {fmtKg(Math.round(p.value * 10) / 10)} kg
            </Text>
          ))}
        </Card>
      )}

      {w.exercises.map((e, i) => (
        <Card key={`${e.exerciseId}-${i}`}>
          <Pressable onPress={() => router.push({ pathname: '/exercise', params: { id: e.exerciseId } })}>
            <Row>
              <ExerciseThumb exercise={ex.get(e.exerciseId)} size={36} />
              <Text style={{ flex: 1, fontWeight: '700', color: colors.primary }}>{ex.name(e.exerciseId)}</Text>
            </Row>
          </Pressable>
          {e.sets.map((s, si) => (
            <Row key={s.id} style={{ justifyContent: 'space-between' }}>
              <Text style={{ color: s.warmup ? colors.warning : colors.muted, width: 30, fontWeight: '700' }}>
                {s.warmup ? 'W' : workingSets({ ...e, sets: e.sets.slice(0, si + 1) }).length}
              </Text>
              <Text style={[styles.text, { flex: 1 }]}>
                {s.weight ? `${fmtKg(s.weight)} kg × ${s.reps}` : `${s.reps} ponavljanja`}
              </Text>
            </Row>
          ))}
        </Card>
      ))}

      <Button title="Ponovi ovaj trening" onPress={repeat} />
      {!w.routineId && <Button title="Spremi kao rutinu" variant="secondary" onPress={saveAsRoutine} />}
      {summary ? (
        <Button title="Gotovo" variant="secondary" onPress={() => router.dismissTo('/')} />
      ) : (
        <Pressable
          onPress={() =>
            Alert.alert('Obrisati trening?', 'Ne može se poništiti.', [
              { text: 'Odustani', style: 'cancel' },
              {
                text: 'Obriši',
                style: 'destructive',
                onPress: () => {
                  deleteWorkout(w.id);
                  router.back();
                },
              },
            ])
          }
          style={{ alignItems: 'center', padding: spacing.md }}
        >
          <Row style={{ gap: 4 }}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={{ color: colors.danger }}>Obriši trening</Text>
          </Row>
        </Pressable>
      )}
    </Screen>
  );
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.muted, { fontSize: 12 }]}>{label}</Text>
      <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>{value}</Text>
    </View>
  );
}
