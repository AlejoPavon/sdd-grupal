import "dotenv/config";
import { buildServer } from "./http/server.js";

const port = Number(process.env.PORT ?? 3000);
const app = buildServer();

try {
  await app.listen({ port, host: "0.0.0.0" });
} catch (error) {
  console.error(error);
  process.exit(1);
}