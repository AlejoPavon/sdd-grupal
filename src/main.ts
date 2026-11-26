import "dotenv/config";

import { buildServer } from "./http/server.js";
import { createRepos, seedIfNeeded } from "./infrastructure/persistence/create-repos.js";

const port = Number(process.env.PORT ?? 3000);

const repos = createRepos();
await seedIfNeeded(repos);

const app = buildServer(repos);

try {
  const address = await app.listen({ port, host: "0.0.0.0" });
  console.log(`Servidor corriendo en ${address}`);
} catch (error) {
  console.error(error);
  process.exit(1);
}
