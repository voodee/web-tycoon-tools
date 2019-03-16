const puppeteer = require("puppeteer");
const express = require("express");
require("dotenv").config();

const evaluate = require("./evaluate");

const app = express();

let lastResult = ["..."];

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto("https://game.web-tycoon.com/#login", {
      waitUntil: "networkidle2"
    });

    // Login
    await page.type("#userEmail", process.env.login);
    await page.type("#userPassword", process.env.password);
    await page.click(".enterButton");
    await page.waitForNavigation();

    while (true) {
      await page.addScriptTag({
        url: "https://code.jquery.com/jquery-3.3.1.min.js"
      });
      await new Promise(res => setTimeout(res, 2000));
      lastResult = await page.evaluate(evaluate);
      await page.reload();
      console.log(lastResult);
      await new Promise(res => setTimeout(res, 10000));
    }

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
