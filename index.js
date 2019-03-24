const puppeteer = require("puppeteer");
const express = require("express");
const ua = require("useragent-generator");
require("dotenv").config();

const auth = require("./helpers/auth");
const tasks = require("./libs/tasks");
const links = require("./libs/links");
const adv = require("./libs/adv");
const workers = require("./libs/workers");

const app = express();

let lastResult = ["..."];

(async () => {
  const config = {};
  config.userAgent = ua.chrome(72);
  while (true) {
    try {
      await Promise.all([
        tasks(console, config),
        links(console, config),
        adv(console, config),
        workers(console, config)
      ]);
    } catch (e) {
      console.error(`Ой, беда!`, (e && e.response && e.response.data) || e);
    }
  }
})();

app.get("/", function(req, res) {
  res.send(`<pre>${lastResult.join("\n")}</pre>`);
});

app.listen(process.env.PORT || 8080, function() {
  console.log("App listening");
});
