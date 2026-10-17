import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Button, Card, Row, Screen, styles } from '../../components/ui';
import { durationMs, formatDuration } from '../../lib/stats';
import { useStore } from '../../lib/store';
import type { Routine, Workout } from '../../lib/types';
import { useExercises, workoutFromRoutine } from '../../lib/workout';
import { colors, spacing } from '../../theme';

export default function Home() {
  const { state, setActive, deleteRoutine } = useStore();
  const ex = useExercises();
  const active = state.active;

  const start = (workout: Workout) => {
    const go = () => {
      setActive(workout);
      router.push('/workout');
    };
    if (!active) return go();
    Alert.alert('Trening je već u tijeku', `"${active.name}" još nije završen.`, [
      { text: 'Nastavi postojeći', onPress: () => router.push('/workout') },
      { text: 'Odbaci i započni novi', style: 'destructive', onPress: go },
      { text: 'Odustani', style: 'cancel' },
    ]);
  };

  const routineMenu = (r: Routine) =>
    Alert.alert(r.name, undefined, [
      { text: 'Uredi', onPress: () => router.push({ pathname: '/routine-edit', params: { id: r.id } }) },
      {
        text: 'Obriši',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Obrisati rutinu?', r.name, [
            { text: 'Odustani', style: 'cancel' },
            { text: 'Obriši', style: 'destructive', onPress: () => deleteRoutine(r.id) },
          ]),
      },
      { text: 'Odustani', style: 'cancel' },
    ]);

  return (
    <Screen>
      {active && <ActiveBanner workout={active} />}

      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Moje rutine</Text>
        <Pressable onPress={() => router.push('/routine-edit')} hitSlop={10}>
          <Row style={{ gap: 4 }}>
            <Ionicons name="add-circle" size={22} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Nova rutina</Text>
          </Row>
        </Pressable>
      </Row>

      {state.routines.length === 0 && (
        <Card>
          <Text style={styles.text}>Još nemaš rutina.</Text>
          <Text style={styles.muted}>
            Napravi rutinu (npr. Push, Pull, Noge ili Full Body) i dodaj u nju vježbe koje želiš. Kad je pokreneš,
            aplikacija prati vrijeme, kilaže i ponavljanja.
          </Text>
          <Button title="+ Nova rutina" variant="secondary" onPress={() => router.push('/routine-edit')} />
        </Card>
      )}

      {state.routines.map((r) => {
        const last = state.workouts.find((w) => w.routineId === r.id);
        return (
          <Pressable
            key={r.id}
            onPress={() => router.push({ pathname: '/routine-edit', params: { id: r.id } })}
            onLongPress={() => routineMenu(r)}
          >
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, flex: 1 }}>{r.name}</Text>
                <Pressable onPress={() => routineMenu(r)} hitSlop={10}>
                  <Ionicons name="ellipsis-horizontal" size={20} color={colors.muted} />
                </Pressable>
              </Row>
              <Text style={styles.muted} numberOfLines={2}>
                {r.exercises.map((e) => ex.name(e.exerciseId)).join(', ') || 'Nema vježbi'}
              </Text>
              {last && (
                <Text style={[styles.muted, { fontSize: 12 }]}>
                  Zadnji put: {new Date(last.startedAt).toLocaleDateString('hr-HR')}
                </Text>
              )}
              <Button
                title="Započni"
                onPress={() => start(workoutFromRoutine(r))}
                disabled={r.exercises.length === 0}
                style={{ marginTop: spacing.xs }}
              />
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}

function ActiveBanner({ workout }: { workout: Workout }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <Pressable onPress={() => router.push('/workout')}>
      <View style={{ backgroundColor: colors.success, borderRadius: 16, padding: spacing.lg, gap: 2 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Trening u tijeku · {workout.name}</Text>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800' }}>{formatDuration(durationMs(workout))}</Text>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Nastavi ›</Text>
        </Row>
      </View>
    </Pressable>
  );
}
