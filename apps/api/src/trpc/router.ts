import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { templatesRouter } from "./routers/templates";
import { propertiesRouter } from "./routers/properties";

export const appRouter = router({
  auth: authRouter,
  templates: templatesRouter,
  properties: propertiesRouter,
});

export type AppRouter = typeof appRouter;
