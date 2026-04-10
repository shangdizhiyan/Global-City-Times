import http from "node:http";
import path from "node:path";
import { pathToFileURL, URL } from "node:url";
import { getCountryDirectory } from "./services/countryService.js";

let serverInstance = null;

export async function startApiServer({ port = Number(process.env.TRADE_API_PORT || 8787), host = "127.0.0.1" } = {}) {
  if (serverInstance) {
    return serverInstance;
  }

  const server = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);
      setCorsHeaders(response);

      if (request.method === "OPTIONS") {
        response.writeHead(204);
        response.end();
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === "/api/health") {
        respondJson(response, 200, { ok: true, service: "trade-country-api" });
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === "/api/countries") {
        const directory = await getCountryDirectory({ refresh: requestUrl.searchParams.get("refresh") === "1" });
        respondJson(response, 200, directory);
        return;
      }

      if (request.method === "GET" && requestUrl.pathname.startsWith("/api/countries/")) {
        const code = requestUrl.pathname.split("/").pop()?.toUpperCase();
        const directory = await getCountryDirectory({ refresh: false });
        const country = directory.countries.find((item) => item.code === code);

        if (!country) {
          respondJson(response, 404, { message: "Country not found" });
          return;
        }

        respondJson(response, 200, {
          sync: directory.sync,
          country
        });
        return;
      }

      respondJson(response, 404, { message: "Not found" });
    } catch (error) {
      respondJson(response, 500, {
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve());
  });

  serverInstance = server;
  return serverInstance;
}

export function getApiServerBaseUrl() {
  if (!serverInstance) {
    return null;
  }

  const address = serverInstance.address();
  if (!address || typeof address === "string") {
    return null;
  }

  return `http://127.0.0.1:${address.port}`;
}

export async function stopApiServer() {
  if (!serverInstance) {
    return;
  }

  await new Promise((resolve, reject) => {
    serverInstance.close((error) => (error ? reject(error) : resolve()));
  });
  serverInstance = null;
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function respondJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

const entryUrl = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";

if (import.meta.url === entryUrl) {
  startApiServer()
    .then((server) => {
      const address = server.address();
      const port = typeof address === "string" || !address ? Number(process.env.TRADE_API_PORT || 8787) : address.port;
      console.log(`trade-country-api listening on http://127.0.0.1:${port}`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
