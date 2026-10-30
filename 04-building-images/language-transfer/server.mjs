import { createServer } from "node:http";
import { hostname } from "node:os";

const server = createServer((request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  let status = 200;
  let payload;
  if (path === "/") {
    payload = {
      message: process.env.MESSAGE ?? "Hello from ARK",
      served_by: hostname(),
    };
  } else if (path === "/health") {
    payload = { status: "ok" };
  } else {
    status = 404;
    payload = { error: "not found" };
  }
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
});

server.listen(8000, "0.0.0.0", () => {
  console.log("ARK Node.js message service listening on port 8000");
});
