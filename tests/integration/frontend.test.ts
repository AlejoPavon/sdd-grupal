import { describe, expect, it } from "vitest";

import { buildServer } from "../../src/http/server";

describe("frontend estático", () => {
  it("sirve el index sin requerir sesión", async () => {
    const app = buildServer();
    const respuesta = await app.inject({ method: "GET", url: "/" });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.headers["content-type"]).toContain("text/html");
    expect(respuesta.body).toContain('id="app"');
    expect(respuesta.body).toContain('rel="icon"');
    await app.close();
  });

  it("sirve hoja de estilos y scripts con el tipo correcto", async () => {
    const app = buildServer();

    for (const url of ["/styles.css", "/app.js", "/helpers.js"]) {
      const respuesta = await app.inject({ method: "GET", url });
      expect(respuesta.statusCode, url).toBe(200);
      expect(respuesta.headers["content-type"], url).toContain(
        url.endsWith(".css") ? "text/css" : "javascript",
      );
    }
    await app.close();
  });

  it("no expone archivos del repo y no rompe el health check", async () => {
    const app = buildServer();

    const privado = await app.inject({ method: "GET", url: "/package.json" });
    expect(privado.statusCode).toBe(404);

    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ status: "ok" });
    await app.close();
  });
});
