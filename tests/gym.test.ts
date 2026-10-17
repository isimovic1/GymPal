import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BUILTIN_EXERCISES, matchesSearch, STARTER_ROUTINES } from '../src/lib/exercises';
import {
  e1rm, exerciseHistory, exerciseRecords, findPRs, formatDuration, previousSets, setsPerMuscle, weeklyStats,
  weekStreak, workoutSetCount, workoutVolume,
} from '../src/lib/stats';
import { EMPTY_STATE, reducer } from '../src/lib/store';
import type { SetEntry, Workout } from '../src/lib/types';

let n = 0;
const set = (weight: number | null, reps: number | null, done = true, warmup = false): SetEntry => ({
  id: String(++n), weight, reps, done, warmup,
});
const workout = (id: string, startedAt: string, sets: SetEntry[], exerciseId = 'Barbell_Squat'): Workout => ({
  id, name: id, startedAt, finishedAt: new Date(Date.parse(startedAt) + 3600_000).toISOString(),
  exercises: [{ exerciseId, restSec: 90, sets }],
});

const w1 = workout('w1', '2026-10-06T17:00:00.000Z', [set(20, 10, true, true), set(60, 8), set(60, 8), set(60, 6)]);
const w2 = workout('w2', '2026-10-13T17:00:00.000Z', [set(62.5, 8), set(62.5, 8), set(62.5, 7)]);
// Newest first, as stored.
const history = [w2, w1];

test('bundled database has the exercises the starter routines use', () => {
  assert.ok(BUILTIN_EXERCISES.length > 800);
  const ids = new Set(BUILTIN_EXERCISES.map((e) => e.id));
  for (const r of STARTER_ROUTINES) for (const id of r.exercises) assert.ok(ids.has(id), id);
});

test('search understands Croatian words and muscle names', () => {
  const squat = BUILTIN_EXERCISES.find((e) => e.id === 'Barbell_Squat')!;
  assert.ok(matchesSearch(squat, 'čučanj'));
  assert.ok(matchesSearch(squat, 'kvadricepsi sipka'));
  assert.ok(!matchesSearch(squat, 'biceps'));
  const bench = BUILTIN_EXERCISES.find((e) => e.id === 'Barbell_Bench_Press_-_Medium_Grip')!;
  assert.ok(matchesSearch(bench, 'prsa'));
});

test('volume and set count ignore warm-ups and unfinished sets', () => {
  assert.equal(workoutVolume(w1), 60 * 8 + 60 * 8 + 60 * 6);
  assert.equal(workoutSetCount(w1), 3);
  const partial = workout('p', '2026-10-14T10:00:00.000Z', [set(50, 5), set(50, null, false)]);
  assert.equal(workoutSetCount(partial), 1);
});

test('previous sets come from the latest workout with the exercise', () => {
  const prev = previousSets(history, 'Barbell_Squat')!;
  assert.equal(prev.length, 3);
  assert.equal(prev[0].weight, 62.5);
  // When looking from before w2 started, w1 is the previous one.
  assert.equal(previousSets(history, 'Barbell_Squat', w2.startedAt)![1].weight, 60);
  assert.equal(previousSets(history, 'Leg_Press'), null);
});

test('e1rm, records and PR detection', () => {
  assert.equal(e1rm(100, 1), 100);
  assert.ok(Math.abs(e1rm(60, 8) - 76) < 1e-9);
  const r = exerciseRecords(history, 'Barbell_Squat');
  assert.equal(r.maxWeight, 62.5);
  assert.equal(r.maxReps, 8);
  const prs = findPRs(w2, history);
  assert.deepEqual(prs.map((p) => p.kind).sort(), ['e1rm', 'volume', 'weight']);
  assert.deepEqual(findPRs(w1, history), []); // first session sets no records
});

test('exercise history is oldest first with the best set', () => {
  const h = exerciseHistory(history, 'Barbell_Squat');
  assert.deepEqual(h.map((x) => x.workoutId), ['w1', 'w2']);
  assert.equal(h[1].bestSet.weight, 62.5);
});

test('weekly stats, streak and muscle sets', () => {
  const weeks = weeklyStats(history, '2026-10-17', 3);
  assert.deepEqual(weeks.map((w) => w.week), ['2026-09-28', '2026-10-05', '2026-10-12']);
  assert.deepEqual(weeks.map((w) => w.workouts), [0, 1, 1]);
  assert.equal(weekStreak(history, '2026-10-17'), 2);
  assert.equal(weekStreak(history, '2026-10-27'), 0);
  const m = setsPerMuscle(history, '2026-10-01', () => ['quadriceps']);
  assert.deepEqual(m, [{ muscle: 'quadriceps', sets: 6 }]);
});

test('finishing a workout keeps only completed sets and exercises', () => {
  const active: Workout = {
    id: 'a', name: 'A', startedAt: '2026-10-17T08:00:00.000Z',
    exercises: [
      { exerciseId: 'Barbell_Squat', restSec: 90, sets: [set(70, 5), set(null, null, false)] },
      { exerciseId: 'Leg_Press', restSec: 90, sets: [set(null, null, false)] },
    ],
  };
  let s = reducer(EMPTY_STATE, { type: 'setActive', workout: active });
  s = reducer(s, { type: 'finishActive', finishedAt: '2026-10-17T09:00:00.000Z' });
  assert.equal(s.active, null);
  assert.equal(s.workouts.length, 1);
  assert.equal(s.workouts[0].exercises.length, 1);
  assert.equal(s.workouts[0].exercises[0].sets.length, 1);
});

test('formatDuration', () => {
  assert.equal(formatDuration(65_000), '1:05');
  assert.equal(formatDuration(3_909_000), '1:05:09');
});
