const puppeteer = require("puppeteer");
const express = require("express");
require("dotenv").config();

const auth = require("./helpers/auth");
const tasks = require("./libs/tasks");
const links = require("./libs/links");
const adv = require("./libs/adv");
const workers = require("./libs/workers");

const app = express();

let lastResult = ["..."];

(async () => {
  while (true) {
    try {
      await Promise.all([
        tasks(console),
        links(console),
        adv(console),
        workers(console)
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
