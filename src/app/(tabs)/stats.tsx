import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BarChart } from '../../components/charts';
import { fmtKg } from '../../components/SetRow';
import { Card, ProgressBar, Row, Screen, Segmented, styles } from '../../components/ui';
import { addDays, shortDate, todayKey } from '../../lib/dates';
import { muscleLabel } from '../../lib/exercises';
import { exerciseRecords, formatDurationShort, setsPerMuscle, weeklyStats, weekStreak } from '../../lib/stats';
import { useStore } from '../../lib/store';
import { useExercises } from '../../lib/workout';
import { colors, spacing } from '../../theme';

type Metric = 'workouts' | 'volume' | 'duration';

export default function Stats() {
  const { state } = useStore();
  const ex = useExercises();
  const today = todayKey();
  const [metric, setMetric] = useState<Metric>('workouts');
  const weeks = weeklyStats(state.workouts, today, 8);
  const thisWeek = weeks[weeks.length - 1];
  const streak = weekStreak(state.workouts, today);
  const muscles = setsPerMuscle(state.workouts, addDays(today, -29), (id) => ex.get(id)?.primaryMuscles ?? []);
  const maxMuscle = Math.max(1, ...muscles.map((m) => m.sets));

  const trained = [...new Set(state.workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId)))];
  const records = trained
    .map((id) => ({ id, r: exerciseRecords(state.workouts, id) }))
    .filter((x) => x.r.maxE1rm > 0)
    .sort((a, b) => b.r.maxE1rm - a.r.maxE1rm);

  if (state.workouts.length === 0) {
    return (
      <Screen>
        <Card>
          <Text style={styles.muted}>Statistika će se pojaviti nakon prvog završenog treninga.</Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Row>
          <Big label="Ukupno treninga" value={String(state.workouts.length)} />
          <Big label="Ovaj tjedan" value={String(thisWeek.workouts)} />
          <Big label="Tjedana zaredom" value={`${streak} 🔥`} />
        </Row>
      </Card>

      <Card title="Zadnjih 8 tjedana">
        <Segmented
          options={[
            { value: 'workouts', label: 'Treninzi' },
            { value: 'volume', label: 'Volumen' },
            { value: 'duration', label: 'Trajanje' },
          ]}
          value={metric}
          onChange={setMetric}
        />
        <BarChart
          color={colors.primary}
          data={weeks.map((w) => ({
            label: shortDate(w.week),
            value:
              metric === 'workouts' ? w.workouts : metric === 'volume' ? Math.round(w.volume) : Math.round(w.durationMs / 60000),
          }))}
        />
        <Text style={[styles.muted, { fontSize: 12 }]}>
          {metric === 'workouts'
            ? 'Broj treninga po tjednu (od ponedjeljka).'
            : metric === 'volume'
              ? 'Ukupni volumen (kg × ponavljanja) po tjednu, bez zagrijavanja.'
              : `Minuta treninga po tjednu · ovaj tjedan ${formatDurationShort(thisWeek.durationMs)}.`}
        </Text>
      </Card>

      {muscles.length > 0 && (
        <Card title="Serije po mišićima (30 dana)">
          {muscles.map((m) => (
            <View key={m.muscle} style={{ gap: 3 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={styles.text}>{muscleLabel(m.muscle)}</Text>
                <Text style={styles.muted}>{m.sets}</Text>
              </Row>
              <ProgressBar value={m.sets} max={maxMuscle} color={colors.primary} />
            </View>
          ))}
          <Text style={[styles.muted, { fontSize: 12 }]}>
            Za rast mišića cilja se oko 10–20 radnih serija tjedno po mišićnoj skupini.
          </Text>
        </Card>
      )}

      {records.length > 0 && (
        <Card title="Osobni rekordi 🏆">
          {records.slice(0, 15).map(({ id, r }) => (
            <Pressable key={id} onPress={() => router.push({ pathname: '/exercise', params: { id } })}>
              <Row style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={[styles.text, { flex: 1 }]} numberOfLines={1}>{ex.name(id)}</Text>
                <Text style={styles.muted}>
                  {fmtKg(r.maxWeight)} kg · 1RM ≈ {fmtKg(Math.round(r.maxE1rm))} kg
                </Text>
              </Row>
            </Pressable>
          ))}
        </Card>
      )}
    </Screen>
  );
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{value}</Text>
      <Text style={[styles.muted, { fontSize: 12, textAlign: 'center' }]}>{label}</Text>
    </View>
  );
}
