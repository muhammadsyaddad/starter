"use client";

import type * as React from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { Badge } from "@repo/ui/ui/badge";
import { Button } from "@repo/ui/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@repo/ui/ui/card";
import { Skeleton } from "@repo/ui/ui/skeleton";
import { R, useAuth } from "@/lib/auth";

/** Rows shown per card; the header link opens the full list. */
export const LIMIT = 5;

type SummaryCardProps = {
  title: string;
  icon: Icon;
  /** Full list page. */
  href: string;
  /** Backend PAGE key; the card hides without READ on it. */
  perm?: string;
  /** Matching rows before the LIMIT cut. */
  count: number;
  loading?: boolean;
  error?: string;
  emptyLabel: string;
  children: React.ReactNode;
};

/** Overview card: a few rows from another module + a link to its page. */
export function SummaryCard({
  title,
  icon: Icon,
  href,
  perm,
  count,
  loading,
  error,
  emptyLabel,
  children,
}: SummaryCardProps) {
  const { can } = useAuth();
  if (!can(perm, R)) return null;

  return (
    <Card className="gap-2 pb-2">
      <CardHeader className="items-center">
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          {title}
          {count > 0 && <Badge variant="secondary">{count}</Badge>}
        </CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href={href}>
              Lihat semua <ArrowRightIcon />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {loading ? (
          <div className="flex flex-col gap-2 px-4 py-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        ) : error ? (
          <p className="px-4 py-6 text-center text-sm text-destructive">{error}</p>
        ) : count === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="divide-y">{children}</ul>
        )}
      </CardContent>
    </Card>
  );
}

/** One clickable row; `href` = the record's detail page. */
export function SummaryRow({
  href,
  title,
  subtitle,
  right,
}: {
  href: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-2.5 outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{title}</div>
          {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
        </div>
        {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
      </Link>
    </li>
  );
}
