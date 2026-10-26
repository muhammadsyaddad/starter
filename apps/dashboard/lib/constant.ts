import {
  type Icon,
  SquaresFourIcon,
  BoatIcon,
  BuildingsIcon,
  UsersIcon,
  GearIcon,
  WarningCircleIcon,
  WrenchIcon,
  ChartLineIcon,
  HandIcon,
  ClipboardTextIcon,
  TrashIcon,
  KeyIcon,
  ListChecksIcon,
  MagnifyingGlassIcon,
  HardDrivesIcon,
  ShieldIcon,
  FilesIcon,
  DatabaseIcon,
  GitPullRequestIcon,
  TruckIcon,
  ShieldCheckIcon,
  CellSignalFullIcon,
  UserListIcon,
  TreeStructureIcon,
  IdentificationBadgeIcon,
  FolderIcon,
} from "@phosphor-icons/react";

export interface NavSubPage {
  id: string;
  name: string;
  icon?: Icon;
  href?: string;
  path?: string;
  /** Backend PAGE key; the item hides without READ on it. */
  perm?: string;
}

export interface NavGroup {
  id: string;
  title?: string;
  items: NavSubPage[];
}

export const navigationData: NavGroup[] = [
  {
    // UNGROUPED: Langsung muncul di bagian atas tanpa label grup
    id: "main-ungrouped",
    items: [
      {
        id: "all-in-one",
        name: "All-in-one app",
        icon: SquaresFourIcon,
        path: "/",
      },
    ],
  },
  {
    id: "group-ship-data",
    title: "Ship Data Management",
    items: [
      {
        id: "ship-summary",
        name: "Summary",
        icon: SquaresFourIcon,
        path: "/ship-data/summary",
      },
      {
        id: "ship-data-kapal",
        name: "Data Kapal",
        icon: BoatIcon,
        path: "/ship-data/data-kapal",
        perm: "SHIP_MANAGEMENT",
      },
      {
        id: "ship-companies",
        name: "Companies",
        icon: BuildingsIcon,
        path: "/ship-data/companies",
        perm: "COMPANY",
      },
      {
        id: "ship-groups",
        name: "Groups",
        icon: UsersIcon,
        path: "/ship-data/groups",
        perm: "GROUP",
      },
      {
        id: "ship-data-pemasangan",
        name: "Data Pemasangan",
        icon: GearIcon,
        path: "/ship-data/data-pemasangan",
        perm: "INSTALLATION",
      },
      {
        id: "ship-problem",
        name: "Problem",
        icon: WarningCircleIcon,
        path: "/ship-data/problem",
        perm: "PROBLEM",
      },
    ],
  },
  {
    id: "maintenance",
    title: "Maintenance",
    items: [
      {
        id: "ship-maintenance",
        name: "Maintenance",
        icon: WrenchIcon,
        path: "/maintenance",
        perm: "MAINTENANCE",
      },
      {
        id: "dispatch-maintenance",
        name: "Dispatch",
        icon: TruckIcon,
        path: "/maintenance/dispatch",
        perm: "MAINTENANCE",
      },
    ],
  },
  {
    id: "konektivitas-management",
    title: "Konektivitas",
    items: [
      {
        id: "vpn-management",
        name: "VPN",
        icon: ShieldCheckIcon,
        path: "/konektivitas/vpn",
      },
      {
        id: "gsm-management",
        name: "GSM",
        icon: CellSignalFullIcon,
        path: "/konektivitas/gsm",
      },
    ],
  },
  {
    id: "group-inventory",
    title: "Inventory",
    items: [
      {
        id: "inventory-devices",
        name: "Devices",
        icon: HardDrivesIcon,
        path: "/inventory/devices",
        perm: "DEVICE",
      },
      {
        id: "inventory-tools",
        name: "Tools",
        icon: WrenchIcon,
        path: "/inventory/tools",
        perm: "TOOLS",
      },
      {
        id: "inventory-loan-requests",
        name: "Loan Requests",
        icon: ClipboardTextIcon,
        path: "/inventory/tools/loan-requests",
        perm: "TOOLS",
      },
      {
        id: "inventory-my-borrowings",
        name: "My Borrowings",
        icon: HandIcon,
        path: "/inventory/tools/my-borrowings",
        perm: "TOOLS",
      },
    ],
  },
  {
    id: "group-user-management",
    title: "Users Management",
    items: [
      {
        id: "user-management",
        name: "Users",
        icon: UserListIcon,
        path: "/user-management/users",
        perm: "USERS",
      },
      {
        id: "division-management",
        name: "Divisions",
        icon: TreeStructureIcon,
        path: "/user-management/divisions",
        perm: "DIVISION",
      },
      {
        id: "roles-management",
        name: "Roles",
        icon: IdentificationBadgeIcon,
        path: "/user-management/roles",
        perm: "ROLE_MANAGEMENT",
      },
      {
        id: "permissions-management",
        name: "Permissions",
        icon: KeyIcon,
        path: "/user-management/permissions",
        perm: "ROLE_MANAGEMENT",
      },
    ],
  },
  {
    id: "group-paperwork",
    title: "Paperwork",
    items: [
      {
        id: "paperwork-documents",
        name: "Documents",
        icon: FilesIcon,
        path: "/documentation",
        perm: "DOCUMENTATION",
      },
      {
        id: "paperwork-deleted",
        name: "Deleted Documents",
        icon: TrashIcon,
        path: "/documentation/deleted",
        perm: "DOCUMENTATION",
      },
      {
        id: "paperwork-template-builder",
        name: "Template Builder",
        icon: GearIcon,
        path: "/documentation/template-builder",
        perm: "TEMPLATE_BUILDER",
      },
      {
        id: "paperwork-generate",
        name: "Generate Document",
        icon: FilesIcon,
        path: "/documentation/generate",
      },
    ],
  },
  {
    id: "group-file-storage",
    title: "File Storage",
    items: [
      {
        id: "file-storage",
        name: "Files",
        icon: FolderIcon,
        path: "/files",
        perm: "DOCUMENTATION",
      },
    ],
  },
  {
    id: "group-projects",
    title: "Projects",
    items: [
      {
        id: "projects-overview",
        name: "Project Overview",
        icon: ListChecksIcon,
        path: "/projects/overview",
        perm: "PROJECTS",
      },
      {
        id: "projects-survey",
        name: "Survey",
        icon: MagnifyingGlassIcon,
        path: "/projects/survey",
        perm: "PROJECTS",
      },
    ],
  },
  {
    id: "group-dev-tools",
    title: "Dev Tools",
    items: [
      {
        id: "dev-replace-db-csv",
        name: "Replace DB Data From CSV",
        icon: DatabaseIcon,
        path: "/dev-tools/replace-db-csv",
      },
      {
        id: "dev-iteration-analysis",
        name: "Iteration Analysis Check",
        icon: GitPullRequestIcon,
        path: "/dev-tools/iteration-analysis",
      },
    ],
  },
];
