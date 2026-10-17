import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';

import { ExerciseThumb } from '../components/ExerciseItem';
import { Stepper } from '../components/Stepper';
import { Button, Card, Field, Row, Screen, styles } from '../components/ui';
import { newId, useStore } from '../lib/store';
import type { RoutineExercise } from '../lib/types';
import { nextRest, restLabel, takePickResult, useExercises } from '../lib/workout';
import { colors, spacing } from '../theme';

export default function RoutineEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state, saveRoutine } = useStore();
  const ex = useExercises();
  const existing = id ? state.routines.find((r) => r.id === id) : undefined;
  const [name, setName] = useState(existing?.name ?? '');
  const [items, setItems] = useState<RoutineExercise[]>(existing?.exercises ?? []);

  useFocusEffect(
    useCallback(() => {
      const picked = takePickResult();
      if (picked?.length) {
        setItems((cur) => [
          ...cur,
          ...picked.map((exerciseId) => ({ exerciseId, sets: 3, restSec: state.settings.defaultRestSec })),
        ]);
      }
    }, [state.settings.defaultRestSec]),
  );

  const update = (i: number, patch: Partial<RoutineExercise>) =>
    setItems((cur) => cur.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (i: number, dir: -1 | 1) =>
    setItems((cur) => {
      const j = i + dir;
      if (j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = () => {
    if (!name.trim()) return Alert.alert('Naziv', 'Upiši naziv rutine, npr. "Push" ili "Full Body A".');
    if (items.length === 0) return Alert.alert('Vježbe', 'Dodaj barem jednu vježbu.');
    saveRoutine({
      id: existing?.id ?? newId(),
      name: name.trim(),
      exercises: items,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    router.back();
  };

  return (
    <Screen>
      <Card>
        <Field label="Naziv rutine" value={name} onChangeText={setName} placeholder="npr. Push, Pull, Noge, Full Body A" />
      </Card>

      {items.map((it, i) => {
        const e = ex.get(it.exerciseId);
        return (
          <Card key={`${it.exerciseId}-${i}`}>
            <Row>
              <ExerciseThumb exercise={e} size={40} />
              <Pressable style={{ flex: 1 }} onPress={() => router.push({ pathname: '/exercise', params: { id: it.exerciseId } })}>
                <Text style={[styles.text, { fontWeight: '600' }]} numberOfLines={2}>{ex.name(it.exerciseId)}</Text>
              </Pressable>
              <Pressable onPress={() => move(i, -1)} hitSlop={6} disabled={i === 0}>
                <Ionicons name="chevron-up" size={20} color={i === 0 ? colors.border : colors.muted} />
              </Pressable>
              <Pressable onPress={() => move(i, 1)} hitSlop={6} disabled={i === items.length - 1}>
                <Ionicons name="chevron-down" size={20} color={i === items.length - 1 ? colors.border : colors.muted} />
              </Pressable>
              <Pressable onPress={() => setItems((cur) => cur.filter((_, j) => j !== i))} hitSlop={6}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row style={{ gap: spacing.sm }}>
                <Text style={styles.muted}>Serije</Text>
                <Stepper value={it.sets} onChange={(v) => update(i, { sets: v })} min={1} max={10} />
              </Row>
              <Pressable
                onPress={() => update(i, { restSec: nextRest(it.restSec) })}
              >
                <Row style={{ gap: 4 }}>
                  <Ionicons name="timer-outline" size={16} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>Odmor {restLabel(it.restSec)}</Text>
                </Row>
              </Pressable>
            </Row>
          </Card>
        );
      })}

      <Button title="+ Dodaj vježbe" variant="secondary" onPress={() => router.push('/exercise-picker')} />
      <Button title="Spremi rutinu" onPress={save} />
    </Screen>
  );
}
