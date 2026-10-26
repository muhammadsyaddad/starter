import * as React from "react";
import { cn } from "../lib/utils";

/** Label + control pair. Wrap any input so forms stay one line per field. */
function Field({
  label,
  className,
  children,
  ...props
}: React.ComponentProps<"label"> & { label: string }) {
  return (
    <label
      className={cn("flex flex-col gap-1.5 text-xs font-medium", className)}
      {...props}
    >
      {label}
      {children}
    </label>
  );
}

export { Field };
