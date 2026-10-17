import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExerciseThumb } from '../components/ExerciseItem';
import { SetHeader, SetRow } from '../components/SetRow';
import { Button, Card, Row, styles } from '../components/ui';
import { durationMs, e1rm, exerciseRecords, formatDuration, previousSets, workoutSetCount, workoutVolume } from '../lib/stats';
import { useStore } from '../lib/store';
import type { SetEntry, Workout, WorkoutExercise } from '../lib/types';
import { emptySet, newWorkoutExercise, nextRest, restLabel, takePickResult, useExercises } from '../lib/workout';
import { colors, spacing } from '../theme';

interface Rest {
  endsAt: number;
  total: number;
}

export default function WorkoutScreen() {
  useKeepAwake();
  const { state, setActive, finishActive, saveRoutine } = useStore();
  const ex = useExercises();
  const w = state.active;
  const [now, setNow] = useState(Date.now());
  const [rest, setRest] = useState<Rest | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (rest && now >= rest.endsAt) {
      Vibration.vibrate([0, 400, 200, 400]);
      setRest(null);
    }
  }, [now, rest]);

  const update = useCallback((fn: (w: Workout) => Workout) => {
    if (state.active) setActive(fn(state.active));
  }, [state.active, setActive]);

  useFocusEffect(
    useCallback(() => {
      const picked = takePickResult();
      if (picked?.length) {
        update((cur) => ({
          ...cur,
          exercises: [...cur.exercises, ...picked.map((id) => newWorkoutExercise(id, state.settings.defaultRestSec))],
        }));
      }
    }, [update, state.settings.defaultRestSec]),
  );

  // Records before this workout, to flag sets that beat them.
  const bestBefore = useMemo(() => {
    const m = new Map<string, number>();
    if (w) for (const e of w.exercises) m.set(e.exerciseId, exerciseRecords(state.workouts, e.exerciseId).maxE1rm);
    return m;
  }, [w?.exercises.map((e) => e.exerciseId).join(), state.workouts]);

  if (!w) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl }}>
        <Text style={styles.muted}>Nema aktivnog treninga.</Text>
        <Button title="Natrag" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const setExercise = (i: number, fn: (e: WorkoutExercise) => WorkoutExercise) =>
    update((cur) => ({ ...cur, exercises: cur.exercises.map((e, j) => (j === i ? fn(e) : e)) }));

  const toggleDone = (i: number, si: number, previous?: SetEntry) => {
    const e = w.exercises[i];
    const s = e.sets[si];
    if (!s.done) {
      // Like Hevy: an empty field takes the previous value shown as its placeholder.
      const weight = s.weight ?? previous?.weight ?? null;
      const reps = s.reps ?? previous?.reps ?? null;
      if (!reps) return Alert.alert('Ponavljanja', 'Upiši broj ponavljanja za ovu seriju.');
      setExercise(i, (cur) => ({
        ...cur,
        sets: cur.sets.map((x, j) => (j === si ? { ...x, weight, reps, done: true } : x)),
      }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      if (e.restSec > 0) setRest({ endsAt: Date.now() + e.restSec * 1000, total: e.restSec });
    } else {
      setExercise(i, (cur) => ({ ...cur, sets: cur.sets.map((x, j) => (j === si ? { ...x, done: false } : x)) }));
    }
  };

  const setMenu = (i: number, si: number) => {
    const s = w.exercises[i].sets[si];
    Alert.alert(`Serija ${si + 1}`, undefined, [
      {
        text: s.warmup ? 'Označi kao radnu seriju' : 'Označi kao zagrijavanje',
        onPress: () => setExercise(i, (cur) => ({ ...cur, sets: cur.sets.map((x, j) => (j === si ? { ...x, warmup: !x.warmup } : x)) })),
      },
      {
        text: 'Obriši seriju',
        style: 'destructive',
        onPress: () => setExercise(i, (cur) => ({ ...cur, sets: cur.sets.filter((_, j) => j !== si) })),
      },
      { text: 'Odustani', style: 'cancel' },
    ]);
  };

  const exerciseMenu = (i: number) => {
    const e = w.exercises[i];
    Alert.alert(ex.name(e.exerciseId), undefined, [
      { text: 'Upute i povijest', onPress: () => router.push({ pathname: '/exercise', params: { id: e.exerciseId } }) },
      ...(i > 0
        ? [{
            text: 'Pomakni gore',
            onPress: () =>
              update((cur) => {
                const list = [...cur.exercises];
                [list[i - 1], list[i]] = [list[i], list[i - 1]];
                return { ...cur, exercises: list };
              }),
          }]
        : []),
      {
        text: 'Ukloni vježbu',
        style: 'destructive' as const,
        onPress: () => update((cur) => ({ ...cur, exercises: cur.exercises.filter((_, j) => j !== i) })),
      },
      // Android shows at most three buttons; the menu is dismissed by tapping outside.
    ], { cancelable: true });
  };

  const finish = () => {
    const done = workoutSetCount(w);
    if (done === 0) {
      return Alert.alert('Nijedna serija nije označena', 'Označi odrađene serije kvačicom ili odbaci trening.', [
        { text: 'Nastavi trening', style: 'cancel' },
        { text: 'Odbaci trening', style: 'destructive', onPress: discardNow },
      ]);
    }
    Alert.alert('Završiti trening?', `${done} serija · ${formatDuration(durationMs(w, now))}`, [
      { text: 'Nastavi', style: 'cancel' },
      { text: 'Završi', onPress: complete },
    ]);
  };

  const complete = () => {
    const routine = w.routineId ? state.routines.find((r) => r.id === w.routineId) : undefined;
    const logged = w.exercises.filter((e) => e.sets.some((s) => s.done));
    const changed =
      routine &&
      (routine.exercises.length !== logged.length ||
        routine.exercises.some((re, i) => re.exerciseId !== logged[i]?.exerciseId || re.sets !== logged[i].sets.filter((s) => s.done).length));
    const done = () => {
      const id = w.id;
      finishActive();
      router.replace({ pathname: '/workout-detail', params: { id, summary: '1' } });
    };
    if (routine && changed) {
      Alert.alert('Ažurirati rutinu?', `Vježbe ili broj serija razlikuju se od rutine "${routine.name}".`, [
        { text: 'Ne', onPress: done },
        {
          text: 'Ažuriraj',
          onPress: () => {
            saveRoutine({
              ...routine,
              exercises: logged.map((e) => ({
                exerciseId: e.exerciseId,
                restSec: e.restSec,
                sets: e.sets.filter((s) => s.done).length,
              })),
            });
            done();
          },
        },
      ]);
    } else done();
  };

  const discardNow = () => {
    setActive(null);
    router.back();
  };

  const discard = () =>
    Alert.alert('Odbaciti trening?', 'Ništa od ovog treninga neće se spremiti.', [
      { text: 'Odustani', style: 'cancel' },
      { text: 'Odbaci', style: 'destructive', onPress: discardNow },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={finish} style={{ backgroundColor: colors.success, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Završi</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 160 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 4 }}>
          <TextInput
            value={w.name}
            onChangeText={(name) => update((cur) => ({ ...cur, name }))}
            style={{ fontSize: 22, fontWeight: '800', color: colors.text, padding: 0 }}
          />
          <Row style={{ gap: spacing.lg }}>
            <Stat label="Trajanje" value={formatDuration(durationMs(w, now))} color={colors.primary} />
            <Stat label="Volumen" value={`${Math.round(workoutVolume(w))} kg`} />
            <Stat label="Serije" value={String(workoutSetCount(w))} />
          </Row>
        </View>

        {w.exercises.length === 0 && (
          <Card>
            <Text style={styles.muted}>Dodaj prvu vježbu i kreni.</Text>
          </Card>
        )}

        {w.exercises.map((e, i) => {
          const prev = previousSets(state.workouts, e.exerciseId) ?? [];
          let working = 0;
          return (
            <Card key={`${e.exerciseId}-${i}`}>
              <Row>
                <ExerciseThumb exercise={ex.get(e.exerciseId)} size={40} />
                <Pressable style={{ flex: 1 }} onPress={() => router.push({ pathname: '/exercise', params: { id: e.exerciseId } })}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }} numberOfLines={2}>
                    {ex.name(e.exerciseId)}
                  </Text>
                </Pressable>
                <Pressable onPress={() => exerciseMenu(i)} hitSlop={10}>
                  <Ionicons name="ellipsis-horizontal" size={22} color={colors.muted} />
                </Pressable>
              </Row>
              <Pressable onPress={() => setExercise(i, (cur) => ({ ...cur, restSec: nextRest(cur.restSec) }))}>
                <Row style={{ gap: 4 }}>
                  <Ionicons name="timer-outline" size={15} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 13 }}>Odmor: {restLabel(e.restSec)}</Text>
                </Row>
              </Pressable>
              <SetHeader />
              {e.sets.map((s, si) => {
                const label = s.warmup ? 'W' : String(++working);
                const best = bestBefore.get(e.exerciseId) ?? 0;
                const isPr = best > 0 && !s.warmup && e1rm(s.weight ?? 0, s.reps ?? 0) > best;
                return (
                  <SetRow
                    key={`${s.id}-${s.done}`}
                    set={s}
                    label={label}
                    previous={prev[si]}
                    isPr={isPr}
                    onChange={(patch) =>
                      setExercise(i, (cur) => ({ ...cur, sets: cur.sets.map((x, j) => (j === si ? { ...x, ...patch } : x)) }))
                    }
                    onToggleDone={() => toggleDone(i, si, prev[si])}
                    onMenu={() => setMenu(i, si)}
                  />
                );
              })}
              <Button
                title="+ Dodaj seriju"
                variant="secondary"
                style={{ paddingVertical: 8 }}
                onPress={() => setExercise(i, (cur) => ({ ...cur, sets: [...cur.sets, emptySet()] }))}
              />
            </Card>
          );
        })}

        <Button title="+ Dodaj vježbu" onPress={() => router.push('/exercise-picker')} />
        <Button title="Odbaci trening" variant="ghost" onPress={discard} style={{ marginTop: spacing.sm }} />
        <Text style={[styles.muted, { fontSize: 12, textAlign: 'center' }]}>
          Dodir na broj serije: zagrijavanje / brisanje. Dodir na "prethodno" kopira prošli rezultat.
        </Text>
      </ScrollView>

      {rest && <RestBar rest={rest} now={now} onChange={setRest} />}
    </SafeAreaView>
  );
}

function Stat({ label, value, color = colors.text }: { label: string; value: string; color?: string }) {
  return (
    <View>
      <Text style={[styles.muted, { fontSize: 12 }]}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color }}>{value}</Text>
    </View>
  );
}

function RestBar({ rest, now, onChange }: { rest: Rest; now: number; onChange: (r: Rest | null) => void }) {
  const left = Math.max(0, Math.ceil((rest.endsAt - now) / 1000));
  const pct = Math.min(1, left / rest.total);
  const adjust = (sec: number) => onChange({ endsAt: rest.endsAt + sec * 1000, total: Math.max(1, rest.total + sec) });
  return (
    <View
      style={{
        position: 'absolute',
        left: spacing.md,
        right: spacing.md,
        bottom: spacing.lg,
        backgroundColor: colors.text,
        borderRadius: 16,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Odmor</Text>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
        </Text>
        <Row style={{ gap: spacing.sm }}>
          <RestButton label="−15" onPress={() => adjust(-15)} />
          <RestButton label="+15" onPress={() => adjust(15)} />
          <RestButton label="Preskoči" onPress={() => onChange(null)} />
        </Row>
      </Row>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: '#ffffff30' }}>
        <View style={{ height: 4, borderRadius: 2, width: `${pct * 100}%`, backgroundColor: colors.success }} />
      </View>
    </View>
  );
}

function RestButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#ffffff22' }}>
      <Text style={{ color: '#fff', fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}
