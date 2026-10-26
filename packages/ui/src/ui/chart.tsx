"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "../lib/utils";

/*
 * Series colours come from the app's CSS tokens (`var(--chart-1)`,
 * `var(--brand)`, ...). ChartContainer exposes each as `--color-<key>`, so
 * charts write `fill="var(--color-leads)"` and never a raw colour.
 */
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  };
};

type ChartContextProps = { config: ChartConfig };

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
  const colorVars = Object.fromEntries(
    Object.entries(config)
      .filter(([, item]) => item.color)
      .map(([key, item]) => [`--color-${key}`, item.color]),
  ) as React.CSSProperties;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        style={{ ...colorVars, ...style }}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-layer]:outline-hidden [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  hideLabel = false,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
  className?: string;
  hideLabel?: boolean;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "grid min-w-32 gap-1.5 border bg-background px-2.5 py-1.5 text-xs shadow-md",
        className,
      )}
    >
      {!hideLabel && label != null && (
        <div className="font-medium">{String(label)}</div>
      )}
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.name ?? "value");
        const itemConfig = config[key];
        return (
          <div key={key} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0"
              style={{ background: `var(--color-${key})` }}
            />
            <span className="text-muted-foreground">
              {itemConfig?.label ?? item.name}
            </span>
            <span className="ml-auto font-mono font-medium tabular-nums">
              {typeof item.value === "number"
                ? item.value.toLocaleString()
                : item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
