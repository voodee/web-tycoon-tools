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

(async () => {
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
    try {
      await Promise.all([
        tasks(browser, console, config),
        workers(browser, console, config)
        // spam(console, config)
      ]);
    } catch (e) {
      console.error(`Ой, беда!`, (e && e.response && e.response.data) || e);
    }
    await browser.close();
  }
})();

// app.get("/", function(req, res) {
//   res.send(`<pre>${lastResult.join("\n")}</pre>`);
// });

// app.listen(process.env.PORT || 8080, function() {
//   console.log("App listening");
// });
