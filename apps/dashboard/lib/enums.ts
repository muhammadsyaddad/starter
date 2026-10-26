/*
 * Status enums shared by the tables: value -> [label, badge variant].
 * One source per domain so filters, badges and forms never disagree.
 */

type Variant =
  "secondary" | "outline" | "brand" | "success" | "warning" | "destructive";
export type Enum = Record<string, readonly [string, Variant]>;

/** Label map for filters and form selects. */
export const labels = (e: Enum) =>
  Object.fromEntries(Object.entries(e).map(([k, [label]]) => [k, label]));

export const ACTIVE_INACTIVE = {
  active: ["Active", "success"],
  inactive: ["Inactive", "secondary"],
} satisfies Enum;

export const ROLE = {
  "SUPER ADMIN": ["Super Admin", "brand"],
  "FINANCE MANAGER": ["Finance Manager", "warning"],
  "FIELD ENGINEER": ["Field Engineer", "secondary"],
  VIEWER: ["Viewer", "outline"],
} satisfies Enum;

export const MAINT_TYPE = {
  CORRECTIVE: ["Corrective", "warning"],
  PREVENTIVE: ["Preventive", "secondary"],
} satisfies Enum;

export const MAINT_STATUS = {
  in_queue: ["In Queue", "secondary"],
  in_progress: ["In Progress", "warning"],
  scheduled: ["Scheduled", "outline"],
  completed: ["Finish", "success"],
  forwarded: ["Forwarded", "brand"],
  canceled: ["Canceled", "destructive"],
} satisfies Enum;

/** Keys = backend values (validated, lowercase). */
export const INSTALL_STATUS = {
  scheduled: ["Scheduled", "outline"],
  in_progress: ["In Progress", "warning"],
  finish: ["Finish", "success"],
  canceled: ["Canceled", "destructive"],
} satisfies Enum;

export const DOC_TYPE = {
  CA: ["CA", "outline"],
  FSR: ["FSR", "outline"],
  BA: ["BA", "outline"],
  FINANCE: ["Finance", "outline"],
  DRAFT: ["Draft", "secondary"],
} satisfies Enum;

export const DOC_STATUS = {
  PENDING: ["Pending", "warning"],
  ONGOING: ["Ongoing", "brand"],
  FINISHED: ["Finished", "success"],
} satisfies Enum;

export const SHIP_TYPE = { FMS: "FMS", EMS: "EMS" };

export const AVAILABILITY = { available: "available", unavailable: "unavailable" };

/** Tool transaction / borrow request status. */
export const TX_STATUS = {
  pending: ["Pending", "warning"],
  on_loan: ["On Loan", "brand"],
  return_pending: ["Return Pending", "warning"],
  returned: ["Returned", "success"],
  returned_broke: ["Returned Broke", "destructive"],
  declined: ["Declined", "destructive"],
  return_rejected: ["Return Rejected", "destructive"],
  partially_approved: ["Partially Approved", "outline"],
} satisfies Enum;

/** Alert level, most severe first (order used for sorting). */
export const ALERT_LEVEL = {
  CRITICAL: ["Critical", "destructive"],
  HIGH: ["High", "destructive"],
  MEDIUM: ["Medium", "warning"],
  LOW: ["Low", "secondary"],
} satisfies Enum;

export const MAINT_CHANNEL = {
  remote: ["Remote", "secondary"],
  dispatch: ["Dispatch", "brand"],
} satisfies Enum;

/** Free text in the backend; these are what the UI writes. */
export const PROJECT_STATUS = {
  "Not Started": ["Not Started", "secondary"],
  "On Progress": ["On Progress", "warning"],
  Done: ["Done", "success"],
  Canceled: ["Canceled", "destructive"],
} satisfies Enum;

/** Backend PAGE keys (RBAC resource_identifier). */
export const PAGE_KEYS = Object.fromEntries(
  "USERS ROLE_MANAGEMENT DIVISION SHIP_MANAGEMENT INSTALLATION PROBLEM MAINTENANCE DEVICE TOOLS COMPANY GROUP DOCUMENTATION TEMPLATE_BUILDER GENERATE_DOCUMENT PROJECTS FINANCE DEV_TOOLS"
    .split(" ")
    .map((k) => [k, k]),
);

export const PERM_ACTION = { 1: "READ", 2: "WRITE", 4: "DELETE", 8: "EXECUTE" };
