// Postbuild step: renders the public marketing routes with a headless
// browser and writes the resulting HTML back into build/, so crawlers
// that don't execute JS still see real content (H1, headings, text, links).
const fs = require("fs");
const path = require("path");
const http = require("http");
const puppeteer = require("puppeteer");

const BUILD_DIR = path.join(__dirname, "..", "build");
const PORT = 45123;

const ROUTES = [
  "/",
  "/login",
  "/register",
  "/docs",
  "/terms",
  "/privacy",
  "/forgot-password",
];

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = req.url.split("?")[0];
    let filePath = path.join(BUILD_DIR, urlPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(BUILD_DIR, "index.html");
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function main() {
  const server = await startServer();
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: "networkidle0" });
      const html = await page.content();
      await page.close();

      const outDir = route === "/" ? BUILD_DIR : path.join(BUILD_DIR, route);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "index.html"), html);
      console.log(`Prerendered ${route}`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
