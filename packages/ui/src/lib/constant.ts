import type { Icon } from "@phosphor-icons/react";

export interface NavSubPage {
  id: string;
  name: string;
  icon?: Icon;
  href?: string;
  path?: string;
  children?: NavSubPage[];
}

export interface NavGroup {
  id: string;
  title?: string;
  items: NavSubPage[];
}
