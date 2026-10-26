"use client";

import * as React from "react";
import { HexagonIcon } from "@phosphor-icons/react";
import { ContextMenu, ContextMenuContent } from "../ui/context-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "../ui/sidebar";
import { RootMenuItems } from "./node-context-menu";
import { SidebarFooterActions } from "./sidebar-footer-actions";
import { TreeItemList } from "./tree-item";
import { TreeUIProvider, type TreeUI } from "./tree-ui-context";
import { useTreeAdapter } from "./tree-provider";
import { useMotionConfig } from "../hooks/use-motion-config";
import { useTree } from "../hooks/use-tree";
import { useTreeDnd } from "../hooks/use-tree-dnd";
import { useTreeSelection } from "../hooks/use-tree-selection";
import { buildVisibleOrder } from "../lib/tree/build-tree";
import type { NodeKind } from "../lib/tree/types";
import type { NavGroup } from "../lib/constant";

// `onSelect` is deliberately not the prop name: it collides with the DOM
// handler that ComponentProps<typeof Sidebar> already carries.
type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  activeId: string | null;
  onSelectNode: (id: string) => void;
  navigationData: NavGroup[];
};

export function AppSidebar({
  activeId,
  onSelectNode: onSelect,
  navigationData,
  ...props
}: AppSidebarProps) {
  const adapter = useTreeAdapter();
  const { nodes, tree } = useTree();
  const motion = useMotionConfig();

  const [renamingId, setRenamingId] = React.useState<string | null>(null);

  // No search in the header, so nothing is ever filtered out.
  const filterVisible = null;
  const visibleOrder = React.useMemo(
    () => buildVisibleOrder(tree, filterVisible),
    [tree],
  );

  const selection = useTreeSelection(nodes, visibleOrder);
  const dnd = useTreeDnd(selection);

  const create = React.useCallback(
    (kind: NodeKind, parentId: string | null) => {
      void adapter.create({ kind, parentId }).then((id) => {
        // A brand-new node is always born nameless — go straight to renaming.
        setRenamingId(id);
        if (kind === "file") onSelect(id);
      });
    },
    [adapter, onSelect],
  );

  const ui = React.useMemo<TreeUI>(
    () => ({
      activeId,
      onSelect,
      renamingId,
      setRenamingId,
      commitRename: (id, name) => {
        setRenamingId(null);
        void adapter.rename(id, name);
      },
      create,
      setCollapsed: (id, collapsed) => void adapter.setCollapsed(id, collapsed),
      filterVisible,
      selection,
      dnd,
      motion,
    }),
    [
      activeId,
      adapter,
      create,
      dnd,
      filterVisible,
      motion,
      onSelect,
      renamingId,
      selection,
    ],
  );

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="p-[9.5px]">
        <div className="flex items-center gap-1.5">
          {/* Placeholder until the real company logo exists. */}
          <HexagonIcon className="size-7 text-sidebar-primary" weight="fill" />
        </div>
      </SidebarHeader>

      <TreeUIProvider value={ui}>
        <ContextMenu>
          <SidebarContent className="px-1.5 py-2">
            <TreeItemList
              nodes={tree}
              level={0}
              filteredNav={navigationData}
              onSelect={onSelect}
            />
          </SidebarContent>
          <ContextMenuContent className="w-52">
            <RootMenuItems />
          </ContextMenuContent>
        </ContextMenu>
      </TreeUIProvider>

      <SidebarFooter className="p-2">
        <SidebarFooterActions />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
