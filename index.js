const Koa = require("koa");

const app = new Koa();

try {
  const port = process.env.PORT || 3000;
  const host = process.env.IP || "0.0.0.0";
  app.listen(port, host);
  console.log("Server running on http://" + host + ":" + port);
} catch (error) {
  console.error("Failed to start server:", error);
}
