// Regenerates src/data/exercises.json from free-exercise-db (public domain,
// https://github.com/yuhonas/free-exercise-db). Run: node scripts/update-exercises.mjs
import { writeFileSync } from 'node:fs';

const SOURCE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const all = await res.json();

const slim = all.map((e) => ({
  id: e.id,
  name: e.name,
  category: e.category,
  equipment: e.equipment ?? 'other',
  level: e.level,
  mechanic: e.mechanic ?? undefined,
  primaryMuscles: e.primaryMuscles,
  secondaryMuscles: e.secondaryMuscles,
  instructions: e.instructions,
  images: e.images,
}));

writeFileSync(new URL('../src/data/exercises.json', import.meta.url), JSON.stringify(slim));
console.log(`Wrote ${slim.length} exercises`);
