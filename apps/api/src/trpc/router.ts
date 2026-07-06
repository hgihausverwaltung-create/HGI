import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { templatesRouter } from "./routers/templates";
import { propertiesRouter } from "./routers/properties";
import { draftsRouter } from "./routers/drafts";

export const appRouter = router({
  auth: authRouter,
  templates: templatesRouter,
  properties: propertiesRouter,
  drafts: draftsRouter,
});

export type AppRouter = typeof appRouter;
