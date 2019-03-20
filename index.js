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

    const page = await browser.newPage();
    await page.goto("https://game.web-tycoon.com/", {
      waitUntil: "networkidle2"
    });

    const token = await page.evaluate(() => localStorage.token);
    const userId = await page.evaluate(() => localStorage.userId);
    await page.close();

    const config = {
      token,
      userId
    };

    await Promise.all([
      tasks(browser, console, config),
      links(browser, console, config),
      adv(browser, console, config),
      workers(browser, console, config)
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
