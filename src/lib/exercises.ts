import data from '../data/exercises.json';
import type { Exercise } from './types';

// Bundled from free-exercise-db (public domain); regenerate with scripts/update-exercises.mjs.
export const BUILTIN_EXERCISES = data as Exercise[];

const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export function imageUrl(path: string): string {
  return IMAGE_BASE + path;
}

/** There is no free video API covering these exercises, so link to a YouTube search instead. */
export function videoUrl(exercise: Exercise): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} exercise proper form`)}`;
}

export const MUSCLE_LABELS: Record<string, string> = {
  abdominals: 'Trbušnjaci',
  abductors: 'Abduktori',
  adductors: 'Aduktori',
  biceps: 'Biceps',
  calves: 'Listovi',
  chest: 'Prsa',
  forearms: 'Podlaktice',
  glutes: 'Gluteus',
  hamstrings: 'Stražnja loža',
  lats: 'Latissimus',
  'lower back': 'Donja leđa',
  'middle back': 'Srednja leđa',
  neck: 'Vrat',
  quadriceps: 'Kvadricepsi',
  shoulders: 'Ramena',
  traps: 'Trapez',
  triceps: 'Triceps',
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Šipka',
  dumbbell: 'Bučice',
  'body only': 'Vlastita težina',
  cable: 'Sajla',
  machine: 'Sprava',
  kettlebells: 'Kettlebell',
  bands: 'Gume',
  'medicine ball': 'Medicinka',
  'exercise ball': 'Pilates lopta',
  'foam roll': 'Valjak',
  'e-z curl bar': 'EZ šipka',
  other: 'Ostalo',
};

export const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Snaga',
  stretching: 'Istezanje',
  plyometrics: 'Pliometrija',
  powerlifting: 'Powerlifting',
  'olympic weightlifting': 'Olimpijsko dizanje',
  strongman: 'Strongman',
  cardio: 'Kardio',
};

export const muscleLabel = (m: string) => MUSCLE_LABELS[m] ?? m;
export const equipmentLabel = (e: string) => EQUIPMENT_LABELS[e] ?? e;

/** Croatian gym words mapped to the English terms used in exercise names. */
const SYNONYMS: Record<string, string> = {
  cucanj: 'squat',
  cucnjevi: 'squat',
  potisak: 'press',
  bench: 'bench press',
  benc: 'bench press',
  mrtvo: 'deadlift',
  dizanje: 'deadlift',
  zgib: 'pull',
  zgibovi: 'pull',
  sklek: 'push',
  sklekovi: 'push',
  veslanje: 'row',
  pregib: 'curl',
  pregibi: 'curl',
  iskorak: 'lunge',
  iskoraci: 'lunge',
  propadanje: 'dip',
  propadanja: 'dip',
  trbusnjaci: 'crunch',
  lat: 'lat',
  ramena: 'shoulder',
  noge: 'leg',
  listovi: 'calf',
  istezanje: 'stretch',
  bucice: 'dumbbell',
  sipka: 'barbell',
  sajla: 'cable',
  sprava: 'machine',
};

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
}

/** Every word must match the name, a muscle or the equipment (in English or Croatian). */
export function matchesSearch(e: Exercise, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const muscles = [...e.primaryMuscles, ...e.secondaryMuscles];
  const hay = normalize(
    [e.name, e.equipment, equipmentLabel(e.equipment), ...muscles, ...muscles.map(muscleLabel)].join(' '),
  );
  return words.every((w) => hay.includes(w) || (SYNONYMS[w] !== undefined && hay.includes(SYNONYMS[w])));
}

export function exerciseIndex(custom: Exercise[]): Map<string, Exercise> {
  const map = new Map<string, Exercise>();
  for (const e of BUILTIN_EXERCISES) map.set(e.id, e);
  for (const e of custom) map.set(e.id, e);
  return map;
}
