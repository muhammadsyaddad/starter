import type { Icon } from "@phosphor-icons/react";
import { Card } from "@repo/ui/ui/card";
import { cn } from "@/lib/utils";

export type StatTone = "dark" | "brand" | "muted" | "default";

const tones: Record<StatTone, { card: string; delta: string }> = {
  dark: { card: "bg-foreground text-background", delta: "text-success" },
  brand: {
    card: "bg-brand text-brand-foreground border-brand",
    delta: "text-brand-foreground/80",
  },
  muted: { card: "bg-muted", delta: "text-success" },
  default: { card: "", delta: "text-success" },
};

type StatCardProps = {
  icon: Icon;
  label: string;
  value: string;
  delta?: string;
  bars?: readonly number[];
  tone?: StatTone;
};

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  bars = [],
  tone = "default",
}: StatCardProps) {
  const max = Math.max(...bars, 1);

  return (
    <Card className={cn("h-full justify-between gap-6 px-4", tones[tone].card)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 opacity-80" />
        <span className="line-clamp-1">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tracking-tight">{value}</span>
          {delta && (
            <span className={cn("text-xs", tones[tone].delta)}>{delta}</span>
          )}
        </div>
        {bars.length > 0 && (
          <div aria-hidden className="flex h-12 items-end gap-0.5">
            {bars.map((v, i) => (
              <span
                key={i}
                className="w-1.5 bg-current opacity-70"
                style={{ height: `${(v / max) * 100}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
