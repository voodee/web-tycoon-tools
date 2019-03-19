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
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    await auth(browser);

    await Promise.all([
      tasks(browser, console),
      links(browser, console),
      adv(browser, console),
      workers(browser, console)
    ]);

    await browser.close();
  } catch (e) {
    console.error(e);
  }
})();

app.get("/", function(req, res) {
  res.send(`<pre>${lastResult.join("\n")}</pre>`);
});

app.listen(process.env.PORT || 8080, function() {
  console.log("App listening");
});
