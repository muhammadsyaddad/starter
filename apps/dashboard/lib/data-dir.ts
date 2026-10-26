import { join } from "node:path";

/** Docs/templates/PDF store. Desktop app points DATA_DIR at its user-data folder. */
export const DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), "data");
