import { addDays, startOfWeek, toDateKey } from './dates';
import type { DateKey, SetEntry, Workout, WorkoutExercise } from './types';

/** Sets that count for stats: finished, not warm-up, with reps. */
export function workingSets(ex: WorkoutExercise): SetEntry[] {
  return ex.sets.filter((s) => s.done && !s.warmup && (s.reps ?? 0) > 0);
}

export function setVolume(s: SetEntry): number {
  return (s.weight ?? 0) * (s.reps ?? 0);
}

export function workoutVolume(w: Workout): number {
  return w.exercises.reduce((a, ex) => a + workingSets(ex).reduce((b, s) => b + setVolume(s), 0), 0);
}

export function workoutSetCount(w: Workout): number {
  return w.exercises.reduce((a, ex) => a + workingSets(ex).length, 0);
}

/** Estimated one-rep max (Epley). */
export function e1rm(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

export function durationMs(w: Workout, now = Date.now()): number {
  const end = w.finishedAt ? Date.parse(w.finishedAt) : now;
  return Math.max(0, end - Date.parse(w.startedAt));
}

/** "1:05:09" or "23:41". */
export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

/** "1 h 5 min" for summaries. */
export function formatDurationShort(ms: number): string {
  const min = Math.round(ms / 60000);
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
}

export function workoutDate(w: Workout): DateKey {
  return toDateKey(new Date(w.startedAt));
}

/**
 * The sets of the exercise from the most recent finished workout that has it,
 * shown as "previous" while training (Hevy-style).
 */
export function previousSets(workouts: Workout[], exerciseId: string, beforeIso?: string): SetEntry[] | null {
  for (const w of workouts) {
    if (beforeIso && w.startedAt >= beforeIso) continue;
    const ex = w.exercises.find((e) => e.exerciseId === exerciseId && e.sets.some((s) => s.done));
    if (ex) return ex.sets.filter((s) => s.done);
  }
  return null;
}

export interface ExerciseSession {
  workoutId: string;
  date: DateKey;
  sets: SetEntry[];
  bestSet: SetEntry;
  bestE1rm: number;
  volume: number;
}

/** Every finished session of an exercise, oldest first. */
export function exerciseHistory(workouts: Workout[], exerciseId: string): ExerciseSession[] {
  const out: ExerciseSession[] = [];
  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      const sets = workingSets(ex);
      if (!sets.length) continue;
      let best = sets[0];
      for (const s of sets) if (e1rm(s.weight ?? 0, s.reps ?? 0) > e1rm(best.weight ?? 0, best.reps ?? 0)) best = s;
      out.push({
        workoutId: w.id,
        date: workoutDate(w),
        sets,
        bestSet: best,
        bestE1rm: e1rm(best.weight ?? 0, best.reps ?? 0),
        volume: sets.reduce((a, s) => a + setVolume(s), 0),
      });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export interface Records {
  maxWeight: number;
  maxE1rm: number;
  maxReps: number;
  maxSessionVolume: number;
}

export function exerciseRecords(workouts: Workout[], exerciseId: string, excludeWorkoutId?: string): Records {
  const r: Records = { maxWeight: 0, maxE1rm: 0, maxReps: 0, maxSessionVolume: 0 };
  for (const s of exerciseHistory(workouts.filter((w) => w.id !== excludeWorkoutId), exerciseId)) {
    r.maxSessionVolume = Math.max(r.maxSessionVolume, s.volume);
    for (const set of s.sets) {
      r.maxWeight = Math.max(r.maxWeight, set.weight ?? 0);
      r.maxReps = Math.max(r.maxReps, set.reps ?? 0);
      r.maxE1rm = Math.max(r.maxE1rm, e1rm(set.weight ?? 0, set.reps ?? 0));
    }
  }
  return r;
}

export interface PersonalRecord {
  exerciseId: string;
  kind: 'weight' | 'e1rm' | 'volume';
  value: number;
}

/** Records the workout beat compared with everything logged before it. */
export function findPRs(workout: Workout, history: Workout[]): PersonalRecord[] {
  const earlier = history.filter((w) => w.id !== workout.id && w.startedAt < workout.startedAt);
  const prs: PersonalRecord[] = [];
  for (const ex of workout.exercises) {
    const sets = workingSets(ex);
    if (!sets.length) continue;
    const before = exerciseRecords(earlier, ex.exerciseId);
    const hadHistory = before.maxE1rm > 0 || before.maxSessionVolume > 0;
    if (!hadHistory) continue;
    const maxWeight = Math.max(...sets.map((s) => s.weight ?? 0));
    const maxE1rm = Math.max(...sets.map((s) => e1rm(s.weight ?? 0, s.reps ?? 0)));
    const volume = sets.reduce((a, s) => a + setVolume(s), 0);
    if (maxWeight > before.maxWeight) prs.push({ exerciseId: ex.exerciseId, kind: 'weight', value: maxWeight });
    if (maxE1rm > before.maxE1rm + 0.01) prs.push({ exerciseId: ex.exerciseId, kind: 'e1rm', value: maxE1rm });
    if (volume > before.maxSessionVolume) prs.push({ exerciseId: ex.exerciseId, kind: 'volume', value: volume });
  }
  return prs;
}

export interface WeekStat {
  week: DateKey;
  workouts: number;
  volume: number;
  durationMs: number;
}

/** Last `count` weeks (Monday-based), oldest first. */
export function weeklyStats(workouts: Workout[], today: DateKey, count: number): WeekStat[] {
  const thisWeek = startOfWeek(today);
  const weeks: WeekStat[] = [];
  for (let i = count - 1; i >= 0; i--) {
    weeks.push({ week: addDays(thisWeek, -7 * i), workouts: 0, volume: 0, durationMs: 0 });
  }
  for (const w of workouts) {
    const wk = weeks.find((x) => x.week === startOfWeek(workoutDate(w)));
    if (!wk) continue;
    wk.workouts += 1;
    wk.volume += workoutVolume(w);
    wk.durationMs += durationMs(w);
  }
  return weeks;
}

/** Consecutive weeks (ending this or last week) with at least one workout. */
export function weekStreak(workouts: Workout[], today: DateKey): number {
  const weeks = new Set(workouts.map((w) => startOfWeek(workoutDate(w))));
  let week = startOfWeek(today);
  if (!weeks.has(week)) week = addDays(week, -7);
  let streak = 0;
  while (weeks.has(week)) {
    streak += 1;
    week = addDays(week, -7);
  }
  return streak;
}

/** Working sets per primary muscle since `from` (inclusive). */
export function setsPerMuscle(
  workouts: Workout[],
  from: DateKey,
  musclesOf: (exerciseId: string) => string[],
): { muscle: string; sets: number }[] {
  const counts = new Map<string, number>();
  for (const w of workouts) {
    if (workoutDate(w) < from) continue;
    for (const ex of w.exercises) {
      const n = workingSets(ex).length;
      if (!n) continue;
      for (const m of musclesOf(ex.exerciseId)) counts.set(m, (counts.get(m) ?? 0) + n);
    }
  }
  return [...counts.entries()].map(([muscle, sets]) => ({ muscle, sets })).sort((a, b) => b.sets - a.sets);
}
