import { createContext } from "react-router";

/** Workerのbindings。`workers/app.ts`でsetし、各routeのloader/actionで`context.get(cloudflareContext)`する。 */
export const cloudflareContext = createContext<{ env: Env; ctx: ExecutionContext }>();
