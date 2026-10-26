/*
 * Placeholder data for the ship-data pages. Static until there is an API to
 * read from — keep personal data out of it.
 */

export const summaryStats = [
  {
    id: "total-kapal",
    label: "Total Kapal",
    value: "128",
    delta: "+4 bulan ini",
    tone: "dark",
    bars: [30, 45, 38, 60, 52, 70, 64, 80],
  },
  {
    id: "kapal-online",
    label: "Kapal Online",
    value: "112",
    delta: "+6,2%",
    tone: "brand",
    bars: [50, 62, 58, 75, 68, 82, 78, 90],
  },
  {
    id: "konektivitas",
    label: "Konektivitas",
    value: "87,5%",
    delta: "+1,3%",
    tone: "muted",
    bars: [70, 72, 68, 80, 76, 84, 82, 88],
  },
  {
    id: "problem",
    label: "Problem Terbuka",
    value: "9",
    delta: "-2 minggu ini",
    tone: "default",
    bars: [40, 55, 48, 35, 42, 30, 28, 22],
  },
] as const;

/*
 * Daily open-problem counts for the last 52 weeks, ending on a fixed date so
 * server and client render the same grid. Deterministic pseudo-random values.
 */
const activityEnd = Date.UTC(2026, 9, 23);
const dayMs = 24 * 60 * 60 * 1000;

export const problemActivity = Array.from({ length: 364 }, (_, i) => {
  const seed = Math.sin(i * 12.9898) * 43758.5453;
  const noise = seed - Math.floor(seed);
  const count = noise < 0.35 ? 0 : Math.floor(noise * noise * 9);
  return {
    date: new Date(activityEnd - (363 - i) * dayMs).toISOString().slice(0, 10),
    count,
  };
});
