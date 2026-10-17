import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import type { AppState, Exercise, Routine, Settings, Workout } from './types';

const STORAGE_KEY = 'gympal:state:v1';

export const EMPTY_STATE: AppState = {
  routines: [],
  workouts: [],
  active: null,
  customExercises: [],
  settings: { defaultRestSec: 90 },
};

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type Action =
  | { type: 'load'; state: AppState }
  | { type: 'saveRoutine'; routine: Routine }
  | { type: 'deleteRoutine'; id: string }
  | { type: 'saveCustomExercise'; exercise: Exercise }
  | { type: 'setActive'; workout: Workout | null }
  | { type: 'finishActive'; finishedAt: string }
  | { type: 'deleteWorkout'; id: string }
  | { type: 'updateSettings'; patch: Partial<Settings> }
  | { type: 'reset' };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'load':
      return action.state;
    case 'saveRoutine': {
      const exists = state.routines.some((r) => r.id === action.routine.id);
      return {
        ...state,
        routines: exists
          ? state.routines.map((r) => (r.id === action.routine.id ? action.routine : r))
          : [...state.routines, action.routine],
      };
    }
    case 'deleteRoutine':
      return { ...state, routines: state.routines.filter((r) => r.id !== action.id) };
    case 'saveCustomExercise':
      return {
        ...state,
        customExercises: [...state.customExercises.filter((e) => e.id !== action.exercise.id), action.exercise],
      };
    case 'setActive':
      return { ...state, active: action.workout };
    case 'finishActive': {
      if (!state.active) return state;
      // Drop exercises where nothing was logged; keep only completed sets.
      const exercises = state.active.exercises
        .map((ex) => ({ ...ex, sets: ex.sets.filter((s) => s.done) }))
        .filter((ex) => ex.sets.length > 0);
      const finished: Workout = { ...state.active, exercises, finishedAt: action.finishedAt };
      return {
        ...state,
        active: null,
        workouts: [finished, ...state.workouts].sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
      };
    }
    case 'deleteWorkout':
      return { ...state, workouts: state.workouts.filter((w) => w.id !== action.id) };
    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'reset':
      return EMPTY_STATE;
  }
}

function useActions(dispatch: React.Dispatch<Action>) {
  return useMemo(
    () => ({
      saveRoutine: (routine: Routine) => dispatch({ type: 'saveRoutine', routine }),
      deleteRoutine: (id: string) => dispatch({ type: 'deleteRoutine', id }),
      saveCustomExercise: (exercise: Exercise) => dispatch({ type: 'saveCustomExercise', exercise }),
      setActive: (workout: Workout | null) => dispatch({ type: 'setActive', workout }),
      finishActive: () => dispatch({ type: 'finishActive', finishedAt: new Date().toISOString() }),
      deleteWorkout: (id: string) => dispatch({ type: 'deleteWorkout', id }),
      updateSettings: (patch: Partial<Settings>) => dispatch({ type: 'updateSettings', patch }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [dispatch],
  );
}

type Store = { state: AppState; ready: boolean } & ReturnType<typeof useActions>;

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const actions = useActions(dispatch);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<AppState>;
        dispatch({
          type: 'load',
          state: { ...EMPTY_STATE, ...saved, settings: { ...EMPTY_STATE.settings, ...saved.settings } },
        });
      })
      .catch((e) => console.warn('Učitavanje podataka nije uspjelo', e))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((e) =>
        console.warn('Spremanje podataka nije uspjelo', e),
      );
    }, 300);
  }, [state, ready]);

  const value = useMemo(() => ({ state, ready, ...actions }), [state, ready, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
