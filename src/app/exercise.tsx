import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, Text, View } from 'react-native';

import { LineChart } from '../components/charts';
import { fmtKg } from '../components/SetRow';
import { Button, Card, Row, Screen, Segmented, styles } from '../components/ui';
import { addDays, daysBetween, shortDate } from '../lib/dates';
import { CATEGORY_LABELS, equipmentLabel, imageUrl, muscleLabel, videoUrl } from '../lib/exercises';
import { exerciseHistory, exerciseRecords } from '../lib/stats';
import { useStore } from '../lib/store';
import { useExercises } from '../lib/workout';
import { colors, spacing } from '../theme';

type Metric = 'e1rm' | 'weight' | 'volume';

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useStore();
  const ex = useExercises();
  const e = ex.get(id);
  const [frame, setFrame] = useState(0);
  const [metric, setMetric] = useState<Metric>('e1rm');

  // The dataset has a start and end photo per exercise; alternating them reads like a short animation.
  useEffect(() => {
    if (!e || e.images.length < 2) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % e.images.length), 1200);
    return () => clearInterval(t);
  }, [e]);

  if (!e) {
    return (
      <Screen>
        <Text style={styles.muted}>Vježba nije pronađena.</Text>
      </Screen>
    );
  }

  const history = exerciseHistory(state.workouts, e.id);
  const records = exerciseRecords(state.workouts, e.id);
  const origin = history[0]?.date;
  const points = history.map((h) => ({
    x: origin ? daysBetween(origin, h.date) : 0,
    y: metric === 'e1rm' ? h.bestE1rm : metric === 'weight' ? Math.max(...h.sets.map((s) => s.weight ?? 0)) : h.volume,
  }));

  return (
    <Screen>
      <Stack.Screen options={{ title: e.name }} />
      {e.images.length > 0 && (
        <Pressable onPress={() => setFrame((f) => (f + 1) % e.images.length)}>
          <Image
            source={{ uri: imageUrl(e.images[frame % e.images.length]) }}
            style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: colors.card }}
            resizeMode="contain"
          />
        </Pressable>
      )}
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{e.name}</Text>
      <Row style={{ flexWrap: 'wrap', gap: 6 }}>
        {e.primaryMuscles.map((m) => <Tag key={m} label={muscleLabel(m)} strong />)}
        {e.secondaryMuscles.map((m) => <Tag key={m} label={muscleLabel(m)} />)}
        <Tag label={equipmentLabel(e.equipment)} />
        {CATEGORY_LABELS[e.category] ? <Tag label={CATEGORY_LABELS[e.category]} /> : null}
      </Row>

      <Button title="▶  Pogledaj video na YouTubeu" onPress={() => Linking.openURL(videoUrl(e))} />

      {history.length > 0 && (
        <Card title="Rekordi">
          <Row style={{ flexWrap: 'wrap' }}>
            <Record label="Najveća težina" value={`${fmtKg(records.maxWeight)} kg`} />
            <Record label="Proc. 1RM" value={`${fmtKg(Math.round(records.maxE1rm * 10) / 10)} kg`} />
            <Record label="Najviše ponavljanja" value={String(records.maxReps)} />
            <Record label="Najveći volumen" value={`${Math.round(records.maxSessionVolume)} kg`} />
          </Row>
        </Card>
      )}

      {history.length > 1 && (
        <Card title="Napredak">
          <Segmented
            options={[
              { value: 'e1rm', label: 'Proc. 1RM' },
              { value: 'weight', label: 'Težina' },
              { value: 'volume', label: 'Volumen' },
            ]}
            value={metric}
            onChange={setMetric}
          />
          <LineChart points={points} xLabel={(x) => (origin ? shortDate(addDays(origin, x)) : '')} />
        </Card>
      )}

      {history.length > 0 && (
        <Card title="Povijest">
          {[...history].reverse().slice(0, 10).map((h) => (
            <Pressable key={h.workoutId} onPress={() => router.push({ pathname: '/workout-detail', params: { id: h.workoutId } })}>
              <View style={{ paddingVertical: 6, gap: 2 }}>
                <Text style={[styles.text, { fontWeight: '600' }]}>{shortDate(h.date)}</Text>
                <Text style={styles.muted}>
                  {h.sets.map((s) => (s.weight ? `${fmtKg(s.weight)}×${s.reps}` : `×${s.reps}`)).join('   ')}
                </Text>
              </View>
            </Pressable>
          ))}
        </Card>
      )}

      {e.instructions.length > 0 && (
        <Card title="Upute">
          {e.instructions.map((step, i) => (
            <Row key={i} style={{ alignItems: 'flex-start' }}>
              <Text style={{ color: colors.primary, fontWeight: '800', width: 18 }}>{i + 1}.</Text>
              <Text style={[styles.text, { flex: 1 }]}>{step}</Text>
            </Row>
          ))}
          <Text style={[styles.muted, { fontSize: 11 }]}>Upute i slike: free-exercise-db (javno vlasništvo).</Text>
        </Card>
      )}
    </Screen>
  );
}

function Tag({ label, strong }: { label: string; strong?: boolean }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: strong ? colors.primary : colors.primarySoft }}>
      <Text style={{ color: strong ? '#fff' : colors.primary, fontWeight: '600', fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function Record({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: '50%', paddingVertical: spacing.xs }}>
      <Row style={{ gap: 4 }}>
        <Ionicons name="trophy-outline" size={14} color={colors.warning} />
        <Text style={[styles.muted, { fontSize: 12 }]}>{label}</Text>
      </Row>
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{value}</Text>
    </View>
  );
}
