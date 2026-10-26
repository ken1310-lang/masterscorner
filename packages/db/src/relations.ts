import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = {
  ...defineRelations(schema),
  ...schema.authRelations,
  ...schema.masterRelations,
  ...schema.classRelations,
  ...schema.proSiteRelations,
};
