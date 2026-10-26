import { documentsApi, deletedApi } from "@/components/tables/documentation";
import { devicesApi, toolsApi } from "@/components/tables/inventory";
import { gsmApi, maintenanceApis } from "@/components/tables/operations";
import { projectApis } from "@/components/tables/projects";
import { alertsApi, companiesApi, groupsApi, installationsApi } from "@/components/tables/ship-data";
import { requestsApi } from "@/components/tables/tool-loans";
import { divisionsApi, permissionsApi, rolesApi, usersApi } from "@/components/tables/user-management";

/** Sidebar path -> adapters its page lists (same keys as the page, so the cache is shared). */
export const PREFETCH: Record<string, { list: () => Promise<unknown> }[]> = {
  "/ship-data/companies": [companiesApi()],
  "/ship-data/groups": [groupsApi],
  "/ship-data/data-pemasangan": [installationsApi],
  "/ship-data/problem": [alertsApi],
  "/maintenance": [maintenanceApis.remote],
  "/maintenance/dispatch": [maintenanceApis.dispatch],
  "/konektivitas/gsm": [gsmApi],
  "/inventory/devices": [devicesApi],
  "/inventory/tools": [toolsApi],
  "/inventory/tools/loan-requests": [requestsApi()],
  "/inventory/tools/my-borrowings": [requestsApi(true)],
  "/user-management/users": [usersApi],
  "/user-management/divisions": [divisionsApi],
  "/user-management/roles": [rolesApi],
  "/user-management/permissions": [permissionsApi],
  "/documentation": [documentsApi],
  "/documentation/deleted": [deletedApi],
  "/projects/overview": [projectApis.projects],
  "/projects/survey": [projectApis.surveys],
};
