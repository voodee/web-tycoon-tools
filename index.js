const puppeteer = require("puppeteer");
const express = require("express");
const ua = require("useragent-generator");
require("dotenv").config();

const auth = require("./helpers/auth");
const tasks = require("./libs/tasks");
const workers = require("./libs/workers");
const spam = require("./libs/spam");

const app = express();

let lastResult = ["..."];

const addLog = (type, ...args) => {
  console[type](...args);

  lastResult.push(
    `[${new Date(Date.now()).toLocaleString()}] ${type}: ${args}`
  );
  if (lastResult.length > 200) {
    lastResult.shift();
  }
};

const logger = {
  log: addLog.bind(null, "log"),
  info: addLog.bind(null, "info"),
  warn: addLog.bind(null, "warn"),
  error: addLog.bind(null, "error")
};

setTimeout(async () => {
  let config = {};
  config.userAgent = ua.chrome(72);
  while (true) {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--override-plugin-power-saver-for-testing=never",
        "--disable-extensions-http-throttling"
      ]
    });

    config = {
      ...config,
      ...(await auth(browser, config))
    };

    setInterval(async () => {
      const pages = await browser.pages();
      for (const p of pages) {
        const metrics = await p.metrics();
        const title = await p.title();
        logger.log(
          "== Memory ==",
          title,
          p.url(),
          metrics.JSHeapUsedSize / 1024 / 1024
        );
      }
    }, 1 * 60 * 1000);

    try {
      await Promise.all([
        tasks(browser, logger, config),
        workers(browser, logger, config)
        // spam(console, config)
      ]);
    } catch (e) {
      console.error(`Ой, беда!`, (e && e.response && e.response.data) || e);
    }
    await browser.close();
  }
}, 1e4);

app.get("/", function(req, res) {
  res.send(
    `<pre>${lastResult
      .slice()
      .reverse()
      .join("\n")}</pre>
      <script>setTimeout(location.reload.bind(location), 5000)</script>`
  );
});

const port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log("App listening on port", port);
});
