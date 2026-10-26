import {
  ArrowSquareOutIcon,
  ChartBarIcon,
  DesktopIcon,
  DeviceMobileIcon,
  GlobeIcon,
  ShieldIcon,
  UserIcon,
  WifiHighIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { Card } from "@repo/ui/ui/card";
import type { kpis } from "./data";

type Kpi = (typeof kpis)[number];

const icons: Record<Kpi["id"], Icon> = {
  monitoring: DesktopIcon,
  openvpn: ShieldIcon,
  thingsboard: ChartBarIcon,
  emqx: WifiHighIcon,
  ramus: GlobeIcon,
  "ramus-asia": UserIcon,
  pinisi: DeviceMobileIcon,
  bki: WrenchIcon,
};

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = icons[kpi.id];
  // "#" means the link is not set yet; render the tile without a link.
  const linked = kpi.href !== "#";

  const body = (
    <Card
      className="group relative h-full transition-colors duration-500 hover:border-brand items-center justify-center gap-2 overflow-hidden px-4 py-5 text-center"
    >
      <span
        aria-hidden
        className="absolute inset-0 origin-left scale-x-0 bg-brand transition-transform duration-500 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
      />
      <Icon className="relative size-6 text-muted-foreground transition-colors duration-500 group-hover:text-brand-foreground" />
      <span className="relative line-clamp-1 text-sm font-medium transition-colors duration-500 group-hover:text-brand-foreground">{kpi.label}</span>
      <span className="relative flex h-4 items-center gap-1 text-xs text-muted-foreground transition-colors duration-500 group-hover:text-brand-foreground">
        {kpi.domain || (linked && <ArrowSquareOutIcon className="size-4" />)}
      </span>
    </Card>
  );

  return linked ? (
    <a href={kpi.href} target="_blank" rel="noopener noreferrer">
      {body}
    </a>
  ) : (
    body
  );
}
