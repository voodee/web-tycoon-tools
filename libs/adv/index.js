const puppeteer = require("puppeteer");
const axios = require("axios");
const auth = require("../../helpers/auth");
const make = require("./make");
const clear = require("./clear");

const HOST = "https://game.web-tycoon.com/api/";

module.exports = async (logger, { userAgent }) => {
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
  let config = {
    userAgent,
    ...(await auth(browser, { userAgent }))
  };

  while (1) {
    const page = await browser.newPage();

    page.on("response", async response => {
      const url = response.url();
      if (url.includes("init")) {
        // получаем сайты пользователя
        config.initData = await response.json();
      }
    });

    const width = 1196;
    const height = 820;
    await page.emulate({
      userAgent,
      viewport: {
        width,
        height
      }
    });

    await page.goto(
      `https://game.web-tycoon.com/players/${config.userId}/sites`,
      {
        waitUntil: "networkidle2"
      }
    );

    try {
      // поиск рекламы
      await make(browser, logger, config);
    } catch (e) {
      logger.error(
        "Ошибка поиска рекламы",
        (e && e.response && e.response.data) || e
      );
      if (e.error && e.error.code === "AUTHORIZATION_REQUIRED") {
        config = {
          userAgent,
          ...(await auth(browser, { userAgent }))
        };
      }
    }

    try {
      // очистка рекламы
      await clear(browser, logger, config);
    } catch (e) {
      logger.error(
        "Ошибка очистки рекламы",
        (e && e.response && e.response.data) || e
      );
      if (e.error && e.error.code === "AUTHORIZATION_REQUIRED") {
        config = {
          userAgent,
          ...(await auth(browser, { userAgent }))
        };
      }
    }

    await page.close();
    // каждые 30 сек
    await new Promise(res => setTimeout(res, 30 * 1000));
  }

  await browser.close();
};
