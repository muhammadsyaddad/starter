import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/ui/tooltip";
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type ActivityDay = { date: string; count: number };

const levelClasses = [
  "bg-muted",
  "bg-brand/25",
  "bg-brand/50",
  "bg-brand/75",
  "bg-brand",
];

const dayLabels = ["", "Sen", "", "Rab", "", "Jum", ""];

type ActivityHeatmapProps = {
  title: string;
  data: readonly ActivityDay[];
  unit?: string;
};

function levelFor(count: number, max: number) {
  if (count === 0) return 0;
  return Math.min(
    levelClasses.length - 1,
    Math.ceil((count / max) * (levelClasses.length - 1)),
  );
}

export function ActivityHeatmap({
  title,
  data,
  unit = "problem",
}: ActivityHeatmapProps) {
  const counts = new Map(data.map((d) => [d.date, d.count]));
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  // Pad to whole weeks (Sunday first, like GitHub) so each column is a week.
  const first = parseISO(data[0]?.date ?? "1970-01-01");
  const last = parseISO(data.at(-1)?.date ?? "1970-01-01");
  const gridStart = startOfWeek(first);
  const weeks: { date: Date; key: string; inRange: boolean }[][] = [];
  for (let day = gridStart; day <= last; day = addDays(day, 1)) {
    if (day.getDay() === 0) weeks.push([]);
    weeks.at(-1)!.push({
      date: day,
      key: format(day, "yyyy-MM-dd"),
      inRange: day >= first,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <TooltipProvider delayDuration={0}>
          <div className="overflow-x-auto pb-1">
            <div className="flex w-max gap-2 text-[10px] text-muted-foreground">
              <div className="mt-4 grid grid-rows-7 gap-[3px]">
                {dayLabels.map((label, i) => (
                  <span key={i} className="h-3 leading-3">
                    {label}
                  </span>
                ))}
              </div>
              <div className="flex gap-[3px]">
                {weeks.map((week, w) => {
                  const firstOfMonth = week.find((d) => d.date.getDate() === 1);
                  return (
                    <div key={w} className="flex flex-col gap-[3px]">
                      <span className="h-3 w-3 overflow-visible leading-3 whitespace-nowrap">
                        {firstOfMonth &&
                          format(firstOfMonth.date, "MMM", {
                            locale: localeId,
                          })}
                      </span>
                      {week.map(({ date, key, inRange }) => {
                        if (!inRange)
                          return <span key={key} className="size-3" />;
                        const count = counts.get(key) ?? 0;
                        const label = `${count} ${unit} · ${format(date, "d MMM yyyy", { locale: localeId })}`;
                        return (
                          <Tooltip key={key}>
                            <TooltipTrigger asChild>
                              <span
                                role="img"
                                aria-label={label}
                                className={cn(
                                  "size-3",
                                  levelClasses[levelFor(count, max)],
                                )}
                              />
                            </TooltipTrigger>
                            <TooltipContent>{label}</TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TooltipProvider>
        <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>
            {total} {unit} dalam setahun terakhir
          </span>
          <div className="flex items-center gap-1">
            <span>Sedikit</span>
            {levelClasses.map((cls) => (
              <span key={cls} aria-hidden className={cn("size-3", cls)} />
            ))}
            <span>Banyak</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
