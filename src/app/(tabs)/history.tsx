import { router } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Card, Row, styles } from '../../components/ui';
import { durationMs, formatDurationShort, workingSets, workoutSetCount, workoutVolume } from '../../lib/stats';
import { useStore } from '../../lib/store';
import { useExercises } from '../../lib/workout';
import { colors, spacing } from '../../theme';

export default function History() {
  const { state } = useStore();
  const ex = useExercises();

  return (
    <FlatList
      data={state.workouts}
      keyExtractor={(w) => w.id}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
      ListEmptyComponent={
        <Text style={[styles.muted, { textAlign: 'center', marginTop: spacing.xl }]}>
          Još nema treninga. Završeni treninzi pojavit će se ovdje.
        </Text>
      }
      renderItem={({ item: w }) => {
        const date = new Date(w.startedAt);
        return (
          <Pressable onPress={() => router.push({ pathname: '/workout-detail', params: { id: w.id } })}>
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 }}>{w.name}</Text>
                <Text style={styles.muted}>{date.toLocaleDateString('hr-HR', { weekday: 'short', day: 'numeric', month: 'numeric' })}</Text>
              </Row>
              <Text style={styles.muted}>
                {formatDurationShort(durationMs(w))} · {Math.round(workoutVolume(w))} kg · {workoutSetCount(w)} serija
              </Text>
              <View style={{ gap: 2, marginTop: 4 }}>
                {w.exercises.slice(0, 5).map((e, i) => {
                  const sets = workingSets(e);
                  const best = sets.reduce((a, s) => ((s.weight ?? 0) > (a?.weight ?? -1) ? s : a), sets[0]);
                  return (
                    <Text key={i} style={[styles.text, { fontSize: 14 }]} numberOfLines={1}>
                      {sets.length} × {ex.name(e.exerciseId)}
                      {best?.weight ? <Text style={styles.muted}>  · {best.weight} kg × {best.reps}</Text> : null}
                    </Text>
                  );
                })}
                {w.exercises.length > 5 && <Text style={styles.muted}>+ još {w.exercises.length - 5}</Text>}
              </View>
            </Card>
          </Pressable>
        );
      }}
    />
  );
}
