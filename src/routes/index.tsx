import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Habit,
  calcAchievements,
  calcLongestStreak,
  calcStreak,
  dateKey,
  getStage,
  loadHabits,
  nextStage,
  saveHabits,
  todayKey,
} from "@/lib/habits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Habit Garden — Grow your habits, grow your garden" },
      {
        name: "description",
        content:
          "Track daily habits and watch a virtual garden bloom. Streaks turn seeds into trees in Habit Garden.",
      },
      { property: "og:title", content: "Habit Garden" },
      { property: "og:description", content: "Grow your habits, grow your garden." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: Index,
});

const EMOJIS = ["🧘", "📖", "💧", "🏃", "🥗", "✍️", "🎨", "🎸", "💤", "🌅", "🧠", "💪"];
const COLORS = ["leaf", "bloom", "sun", "sky", "bark"];

function Index() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tab, setTab] = useState<"garden" | "today" | "achievements">("today");
  const [showNew, setShowNew] = useState(false);
  const [celebrate, setCelebrate] = useState<string | null>(null);

  useEffect(() => {
    setHabits(loadHabits());
  }, []);

  useEffect(() => {
    if (habits.length) saveHabits(habits);
  }, [habits]);

  const today = todayKey();
  const completedToday = habits.filter((h) => h.completions.includes(today)).length;
  const completion = habits.length ? Math.round((completedToday / habits.length) * 100) : 0;
  const achievements = useMemo(() => calcAchievements(habits), [habits]);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalStreak = habits.reduce((s, h) => s + calcStreak(h), 0);

  const toggleToday = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const has = h.completions.includes(today);
        if (!has) setCelebrate(id);
        return {
          ...h,
          completions: has ? h.completions.filter((d) => d !== today) : [...h.completions, today],
        };
      }),
    );
    if (celebrate) setTimeout(() => setCelebrate(null), 1200);
  };

  const addHabit = (name: string, emoji: string, color: string) => {
    if (!name.trim()) return;
    setHabits((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        emoji,
        color,
        createdAt: new Date().toISOString(),
        completions: [],
      },
    ]);
    setShowNew(false);
  };

  const removeHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <div className="min-h-screen">
      <Header unlocked={unlockedCount} totalStreak={totalStreak} />

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-6 sm:px-8">
        <Hero completion={completion} completedToday={completedToday} total={habits.length} />

        <nav className="mb-8 flex flex-wrap gap-2">
          {(["today", "garden", "achievements"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition-all ${
                tab === t
                  ? "bg-foreground text-background shadow-soft"
                  : "glass-card text-foreground hover:scale-[1.02]"
              }`}
            >
              {t === "today" ? "Today" : t === "garden" ? "My Garden" : "Achievements"}
            </button>
          ))}
          <button
            onClick={() => setShowNew(true)}
            className="ml-auto rounded-full bg-[var(--leaf-deep)] px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:scale-[1.03] hover:shadow-bloom"
          >
            + New habit
          </button>
        </nav>

        {tab === "today" && (
          <TodayView
            habits={habits}
            today={today}
            onToggle={toggleToday}
            onRemove={removeHabit}
            celebrate={celebrate}
            onAddClick={() => setShowNew(true)}
          />
        )}
        {tab === "garden" && <GardenView habits={habits} />}
        {tab === "achievements" && <AchievementsView achievements={achievements} />}
      </main>

      {showNew && <NewHabitDialog onClose={() => setShowNew(false)} onAdd={addHabit} />}

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        Tend daily. Grow forever. · Habit Garden
      </footer>
    </div>
  );
}

function Header({ unlocked, totalStreak }: { unlocked: number; totalStreak: number }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-[color-mix(in_oklab,var(--background)_80%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--gradient-meadow)] text-xl shadow-soft">
            🌿
          </div>
          <div className="min-w-0">
            <div className="font-display text-lg font-bold leading-none">Habit Garden</div>
            <div className="text-[11px] text-muted-foreground">where streaks blossom</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="hidden rounded-full bg-secondary px-3 py-1.5 font-semibold sm:inline-flex">
            🔥 {totalStreak} day{totalStreak === 1 ? "" : "s"} growing
          </span>
          <span className="rounded-full bg-accent px-3 py-1.5 font-semibold text-accent-foreground">
            🏅 {unlocked} unlocked
          </span>
        </div>
      </div>
    </header>
  );
}

function Hero({
  completion,
  completedToday,
  total,
}: {
  completion: number;
  completedToday: number;
  total: number;
}) {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();
  const date = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="relative mb-10 overflow-hidden rounded-3xl border border-border/60 bg-[var(--gradient-dawn)] p-8 shadow-soft sm:p-12">
      <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[var(--sun)] opacity-50 blur-3xl" />
      <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-[var(--leaf)] opacity-40 blur-3xl" />
      <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--leaf-deep)]">
            {date}
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
            {greeting}. <br />
            <span className="text-gradient-meadow">Your garden awaits.</span>
          </h1>
          <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
            Small daily acts grow into something wild and beautiful. Check in with the habits
            you're tending today.
          </p>
        </div>
        <div className="relative shrink-0">
          <div className="relative grid h-44 w-44 place-items-center rounded-full bg-card shadow-bloom">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="var(--muted)" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="var(--leaf-deep)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(completion / 100) * 276} 276`}
                style={{ transition: "stroke-dasharray 0.7s ease" }}
              />
            </svg>
            <div className="text-center">
              <div className="font-display text-4xl font-bold">{completion}%</div>
              <div className="text-xs text-muted-foreground">
                {completedToday}/{total || 0} today
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TodayView({
  habits,
  today,
  onToggle,
  onRemove,
  celebrate,
  onAddClick,
}: {
  habits: Habit[];
  today: string;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  celebrate: string | null;
  onAddClick: () => void;
}) {
  if (!habits.length) {
    return (
      <EmptyState
        title="Plant your first habit"
        subtitle="Choose something small. Tomorrow's forest starts with today's seed."
        action="Add a habit"
        onAction={onAddClick}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {habits.map((h) => {
        const done = h.completions.includes(today);
        const streak = calcStreak(h);
        const stage = getStage(streak);
        const next = nextStage(streak);
        const progress = next ? Math.min(100, ((streak - stage.min) / (next.min - stage.min)) * 100) : 100;
        return (
          <article
            key={h.id}
            className={`glass-card group relative overflow-hidden rounded-3xl p-5 transition-all hover:-translate-y-1 ${
              done ? "ring-2 ring-[var(--leaf)]" : ""
            }`}
          >
            <div className="mb-4 flex items-start gap-3">
              <div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl"
                style={{ background: `color-mix(in oklab, var(--${h.color}) 25%, transparent)` }}
              >
                <span className={done ? "animate-sway inline-block" : "inline-block"}>{h.emoji}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-display text-lg font-semibold leading-tight">{h.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {stage.label} {stage.emoji} · {streak} day streak
                </p>
              </div>
              <button
                onClick={() => onRemove(h.id)}
                aria-label="Remove habit"
                className="rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground group-hover:opacity-100"
              >
                ✕
              </button>
            </div>

            <Last7Days completions={h.completions} />

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{stage.label}</span>
                <span>{next ? `→ ${next.label}` : "Maxed 🌟"}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[var(--gradient-meadow)] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => onToggle(h.id)}
              className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                done
                  ? "bg-[var(--leaf-deep)] text-primary-foreground"
                  : "bg-foreground text-background hover:scale-[1.02]"
              }`}
            >
              {done ? "✓ Tended today" : "Mark complete"}
            </button>

            {celebrate === h.id && (
              <span className="pointer-events-none absolute right-6 top-6 animate-float-up text-2xl">
                {stage.emoji}
              </span>
            )}
          </article>
        );
      })}
    </div>
  );
}

function Last7Days({ completions }: { completions: string[] }) {
  const set = new Set(completions);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: dateKey(d), label: d.toLocaleDateString(undefined, { weekday: "narrow" }) };
  });
  return (
    <div className="flex gap-1.5">
      {days.map((d, i) => {
        const done = set.has(d.key);
        return (
          <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`h-8 w-full rounded-lg transition-all ${
                done ? "bg-[var(--leaf-deep)]" : "bg-muted"
              }`}
              title={d.key}
            />
            <span className="text-[10px] text-muted-foreground">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function GardenView({ habits }: { habits: Habit[] }) {
  if (!habits.length) {
    return (
      <EmptyState
        title="Your garden is bare ground"
        subtitle="Add a habit and watch a seedling appear here."
      />
    );
  }

  const sorted = [...habits].sort((a, b) => calcStreak(b) - calcStreak(a));

  return (
    <div className="space-y-8">
      <div className="glass-card relative overflow-hidden rounded-3xl p-6 sm:p-10">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_top,var(--soil),transparent)] opacity-30" />
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--leaf-deep)]">
          The meadow
        </p>
        <h2 className="mb-8 font-display text-3xl font-bold sm:text-4xl">
          {habits.length} plant{habits.length === 1 ? "" : "s"} in your care
        </h2>

        <div className="relative grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {sorted.map((h) => {
            const streak = calcStreak(h);
            const stage = getStage(streak);
            const longest = calcLongestStreak(h);
            return (
              <div
                key={h.id}
                className="group flex flex-col items-center gap-2 rounded-2xl p-3 transition-all hover:-translate-y-1 hover:bg-card/60"
                title={`${h.name} · ${streak} day streak`}
              >
                <div className="relative flex h-24 w-full items-end justify-center">
                  <div className="absolute inset-x-2 bottom-0 h-2 rounded-full bg-[var(--soil)] opacity-40" />
                  <span
                    className="animate-sway text-5xl sm:text-6xl"
                    style={{ animationDelay: `${Math.random() * 2}s` }}
                  >
                    {stage.emoji}
                  </span>
                </div>
                <div className="w-full text-center">
                  <div className="truncate text-xs font-semibold">{h.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    🔥 {streak} · best {longest}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Trees grown"
          value={habits.filter((h) => calcStreak(h) >= 30).length}
          emoji="🌳"
        />
        <StatCard
          label="In bloom"
          value={habits.filter((h) => calcStreak(h) >= 14).length}
          emoji="🌸"
        />
        <StatCard
          label="Total check-ins"
          value={habits.reduce((s, h) => s + h.completions.length, 0)}
          emoji="✨"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div className="glass-card flex items-center gap-4 rounded-3xl p-5">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--gradient-bloom)] text-2xl">
        {emoji}
      </div>
      <div className="min-w-0">
        <div className="font-display text-3xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function AchievementsView({ achievements }: { achievements: ReturnType<typeof calcAchievements> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {achievements.map((a) => (
        <div
          key={a.id}
          className={`relative overflow-hidden rounded-3xl p-6 transition-all ${
            a.unlocked
              ? "glass-card shadow-bloom hover:-translate-y-1"
              : "border border-dashed border-border bg-card/30"
          }`}
        >
          <div
            className={`mb-3 grid h-14 w-14 place-items-center rounded-2xl text-3xl ${
              a.unlocked ? "bg-[var(--gradient-bloom)]" : "bg-muted grayscale"
            }`}
          >
            {a.emoji}
          </div>
          <h3 className="font-display text-xl font-semibold">{a.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
          <div className="mt-4 text-[11px] font-semibold uppercase tracking-widest">
            {a.unlocked ? (
              <span className="text-[var(--leaf-deep)]">✓ Unlocked</span>
            ) : (
              <span className="text-muted-foreground">Locked</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="glass-card flex flex-col items-center gap-4 rounded-3xl px-6 py-16 text-center">
      <div className="animate-sway text-6xl">🌱</div>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{subtitle}</p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="rounded-full bg-[var(--leaf-deep)] px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:scale-105"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function NewHabitDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (name: string, emoji: string, color: string) => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState(COLORS[0]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-grow-in w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-bloom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--gradient-meadow)] text-2xl">
            🌱
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">Plant a new habit</h3>
            <p className="text-xs text-muted-foreground">It starts as a tiny seed.</p>
          </div>
        </div>

        <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 10 min stretching"
          className="mb-5 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none ring-ring focus:ring-2"
          onKeyDown={(e) => e.key === "Enter" && onAdd(name, emoji, color)}
        />

        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Symbol
        </label>
        <div className="mb-5 flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`grid h-10 w-10 place-items-center rounded-xl text-xl transition-all ${
                emoji === e ? "bg-foreground text-background scale-110" : "bg-secondary hover:scale-105"
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Color
        </label>
        <div className="mb-6 flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={c}
              className={`h-10 w-10 rounded-xl transition-all ${
                color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-card scale-110" : ""
              }`}
              style={{ background: `var(--${c})` }}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-border px-4 py-3 text-sm font-semibold hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => onAdd(name, emoji, color)}
            disabled={!name.trim()}
            className="flex-1 rounded-2xl bg-[var(--leaf-deep)] px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Plant it
          </button>
        </div>
      </div>
    </div>
  );
}
