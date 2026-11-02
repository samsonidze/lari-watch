import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleRates } from "../server/handlers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const query = Object.fromEntries(
    Object.entries(req.query).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const result = await handleRates(query);
  res.status(result.status);
  for (const [k, v] of Object.entries(result.headers)) res.setHeader(k, v);
  res.json(result.body);
}
