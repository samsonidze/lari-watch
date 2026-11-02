import type { Plugin } from "vite";
import { handleHistory, handleRates, type HandlerResult } from "./handlers.js";

/** Serves /api/* during `vite dev` with the same handlers Vercel runs in production. */
export function nbgDevApi(): Plugin {
  return {
    name: "lari-watch-dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const query = Object.fromEntries(url.searchParams);
        let result: HandlerResult;
        if (url.pathname === "/api/rates") result = await handleRates(query);
        else if (url.pathname === "/api/history") result = await handleHistory(query);
        else return next();

        res.statusCode = result.status;
        for (const [k, v] of Object.entries(result.headers)) res.setHeader(k, v);
        res.end(JSON.stringify(result.body));
      });
    },
  };
}
