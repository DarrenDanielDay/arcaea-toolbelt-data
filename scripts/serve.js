// @ts-check
import handler from "serve-handler";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { extractName, getVersionFromMeta } from "./arcaea.js";

const PORT = 1236;
const HOST = `http://localhost:${PORT}`;
const version = await getVersionFromMeta();
const config = {
  rewrites: [
    {
      source: "data/:json",
      destination: "./dist/:json",
    },
  ],
  headers: [
    {
      source: "**/*",
      headers: [
        {
          key: "Access-Control-Allow-Origin",
          value: "*",
        },
      ],
    },
  ],
};

const server = createServer((request, response) => {
  const url = request.url ?? "/";
  if (url.startsWith("/assets")) {
    console.log(`Handing assets ${url}`);
    return handler(request, response, {
      public: `./arcaea/${extractName(version)}/`,
      ...config,
    });
  }
  return handler(request, response, config);
});

server.listen(PORT, () => {
  console.log(`Serving at ${HOST} ...`);
});
