export type Habit = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
  completions: string[]; // ISO date strings (YYYY-MM-DD)
};

const STORAGE_KEY = "habit-garden:v1";

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function loadHabits(): Habit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedHabits();
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveHabits(habits: Habit[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function seedHabits(): Habit[] {
  const today = new Date();
  const make = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    return dateKey(d);
  };
  const seeded: Habit[] = [
    {
      id: crypto.randomUUID(),
      name: "Morning meditation",
      emoji: "🧘",
      color: "leaf",
      createdAt: make(20),
      completions: [make(0), make(1), make(2), make(3), make(4), make(5), make(6), make(8), make(9), make(10), make(11)],
    },
    {
      id: crypto.randomUUID(),
      name: "Read 20 pages",
      emoji: "📖",
      color: "bloom",
      createdAt: make(14),
      completions: [make(1), make(2), make(3), make(5), make(6)],
    },
    {
      id: crypto.randomUUID(),
      name: "Drink water",
      emoji: "💧",
      color: "sky",
      createdAt: make(30),
      completions: Array.from({ length: 21 }, (_, i) => make(i)),
    },
  ];
  saveHabits(seeded);
  return seeded;
}

export function calcStreak(habit: Habit): number {
  const set = new Set(habit.completions);
  let streak = 0;
  const d = new Date();
  // If today not done, streak starts from yesterday
  if (!set.has(dateKey(d))) d.setDate(d.getDate() - 1);
  while (set.has(dateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function calcLongestStreak(habit: Habit): number {
  const dates = [...habit.completions].sort();
  let longest = 0;
  let current = 0;
  let prev: Date | null = null;
  for (const k of dates) {
    const d = new Date(k);
    if (prev) {
      const diff = Math.round((d.getTime() - prev.getTime()) / 86400000);
      current = diff === 1 ? current + 1 : 1;
    } else current = 1;
    longest = Math.max(longest, current);
    prev = d;
  }
  return longest;
}

export type PlantStage = {
  name: string;
  emoji: string;
  label: string;
  min: number;
};

export const PLANT_STAGES: PlantStage[] = [
  { name: "seed", emoji: "🌱", label: "Seed", min: 0 },
  { name: "sprout", emoji: "🌿", label: "Sprout", min: 3 },
  { name: "bud", emoji: "🌾", label: "Bud", min: 7 },
  { name: "bloom", emoji: "🌸", label: "Bloom", min: 14 },
  { name: "sapling", emoji: "🪴", label: "Sapling", min: 21 },
  { name: "tree", emoji: "🌳", label: "Tree", min: 30 },
  { name: "ancient", emoji: "🌲", label: "Ancient", min: 60 },
];

export function getStage(streak: number): PlantStage {
  let stage = PLANT_STAGES[0];
  for (const s of PLANT_STAGES) if (streak >= s.min) stage = s;
  return stage;
}

export function nextStage(streak: number): PlantStage | null {
  for (const s of PLANT_STAGES) if (s.min > streak) return s;
  return null;
}

export type Achievement = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
};

export function calcAchievements(habits: Habit[]): Achievement[] {
  const totalCompletions = habits.reduce((s, h) => s + h.completions.length, 0);
  const maxStreak = Math.max(0, ...habits.map(calcStreak));
  const maxLongest = Math.max(0, ...habits.map(calcLongestStreak));
  const trees = habits.filter((h) => calcStreak(h) >= 30).length;
  const blooms = habits.filter((h) => calcStreak(h) >= 14).length;

  return [
    { id: "first", title: "First Seed", description: "Plant your first habit", emoji: "🌱", unlocked: habits.length >= 1 },
    { id: "three", title: "Triple Sprout", description: "Track 3 habits", emoji: "🌿", unlocked: habits.length >= 3 },
    { id: "week", title: "Week Warrior", description: "7-day streak", emoji: "🔥", unlocked: maxStreak >= 7 || maxLongest >= 7 },
    { id: "bloom", title: "In Full Bloom", description: "Grow a habit to bloom", emoji: "🌸", unlocked: blooms >= 1 },
    { id: "tree", title: "Mighty Oak", description: "Grow a 30-day tree", emoji: "🌳", unlocked: trees >= 1 },
    { id: "fifty", title: "Half Century", description: "50 total check-ins", emoji: "✨", unlocked: totalCompletions >= 50 },
    { id: "hundred", title: "Garden Keeper", description: "100 total check-ins", emoji: "🏆", unlocked: totalCompletions >= 100 },
  ];
}
