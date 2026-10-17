import { useMemo } from 'react';

import { exerciseIndex } from './exercises';
import { newId, useStore } from './store';
import type { Exercise, Routine, SetEntry, Workout, WorkoutExercise } from './types';

export function emptySet(): SetEntry {
  return { id: newId(), weight: null, reps: null, done: false };
}

export function newWorkoutExercise(exerciseId: string, restSec: number, sets = 3): WorkoutExercise {
  return { exerciseId, restSec, sets: Array.from({ length: Math.max(1, sets) }, emptySet) };
}

export function workoutFromRoutine(routine: Routine): Workout {
  return {
    id: newId(),
    name: routine.name,
    routineId: routine.id,
    startedAt: new Date().toISOString(),
    exercises: routine.exercises.map((e) => newWorkoutExercise(e.exerciseId, e.restSec, e.sets)),
  };
}

/** Same exercises and set counts as a past workout ("repeat"). */
export function workoutFromPast(past: Workout, defaultRest: number): Workout {
  return {
    id: newId(),
    name: past.name,
    routineId: past.routineId,
    startedAt: new Date().toISOString(),
    exercises: past.exercises.map((e) => newWorkoutExercise(e.exerciseId, e.restSec || defaultRest, e.sets.length)),
  };
}

export function emptyWorkout(): Workout {
  const hour = new Date().getHours();
  const name = hour < 12 ? 'Jutarnji trening' : hour < 18 ? 'Popodnevni trening' : 'Večernji trening';
  return { id: newId(), name, startedAt: new Date().toISOString(), exercises: [] };
}

export function useExercises() {
  const { state } = useStore();
  return useMemo(() => {
    const index = exerciseIndex(state.customExercises);
    return {
      index,
      all: [...index.values()],
      get: (id: string): Exercise | undefined => index.get(id),
      name: (id: string) => index.get(id)?.name ?? 'Nepoznata vježba',
    };
  }, [state.customExercises]);
}

/** How many workouts each exercise appears in, so the lists can show favourites first. */
export function useExerciseUsage(): Map<string, number> {
  const { state } = useStore();
  return useMemo(() => {
    const m = new Map<string, number>();
    for (const w of state.workouts) for (const e of w.exercises) m.set(e.exerciseId, (m.get(e.exerciseId) ?? 0) + 1);
    return m;
  }, [state.workouts]);
}

const REST_OPTIONS = [30, 60, 90, 120, 180, 240];

/** Cycles through common rest times when the rest label is tapped. */
export function nextRest(sec: number): number {
  return REST_OPTIONS[(REST_OPTIONS.indexOf(sec) + 1) % REST_OPTIONS.length];
}

export function restLabel(sec: number): string {
  return sec % 60 === 0 ? `${sec / 60} min` : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

// The exercise picker is its own screen; it hands the chosen ids back to the
// screen that opened it through this one-slot mailbox.
let pickResult: string[] | null = null;

export function setPickResult(ids: string[]) {
  pickResult = ids;
}

export function takePickResult(): string[] | null {
  const r = pickResult;
  pickResult = null;
  return r;
}
