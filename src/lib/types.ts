/** ISO date without time, e.g. "2026-10-17". */
export type DateKey = string;

export interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  level?: string;
  mechanic?: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  /** Paths inside free-exercise-db, e.g. "Barbell_Squat/0.jpg". */
  images: string[];
  custom?: boolean;
}

export interface RoutineExercise {
  exerciseId: string;
  sets: number;
  restSec: number;
}

export interface Routine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
  createdAt: string;
}

export interface SetEntry {
  id: string;
  weight: number | null;
  reps: number | null;
  done: boolean;
  /** Warm-up sets are logged but left out of stats and records. */
  warmup?: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  restSec: number;
  sets: SetEntry[];
}

export interface Workout {
  id: string;
  name: string;
  routineId?: string;
  startedAt: string;
  finishedAt?: string;
  exercises: WorkoutExercise[];
  note?: string;
}

export interface Settings {
  defaultRestSec: number;
}

export interface AppState {
  routines: Routine[];
  /** Finished workouts, newest first. */
  workouts: Workout[];
  /** Workout in progress, persisted so it survives the app being closed. */
  active: Workout | null;
  customExercises: Exercise[];
  settings: Settings;
}
