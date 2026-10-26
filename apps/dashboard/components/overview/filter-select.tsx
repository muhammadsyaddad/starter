"use client";

import type * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/ui/select";

/** Select over a label map, with an optional leading "all" option. */
export function FilterSelect<T extends string>({
  options,
  allLabel,
  ...props
}: {
  options: Record<T, string>;
  allLabel?: string;
  name?: string;
  value?: T | "all" | null;
  defaultValue?: T;
  disabled?: boolean;
  onValueChange?: (value: T | "all") => void;
}) {
  return (
    <Select {...(props as React.ComponentProps<typeof Select>)}>
      <SelectTrigger className="w-full sm:w-auto">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value="all">{allLabel}</SelectItem>}
        {Object.entries<string>(options).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
