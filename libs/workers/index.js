const puppeteer = require("puppeteer");
const auth = require("../../helpers/auth");
const vacation = require("./vacation");

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

    const width = 1196;
    const height = 820;
    await page.emulate({
      userAgent,
      viewport: {
        width,
        height
      }
    });

    page.on("response", async response => {
      const url = response.url();
      if (url.includes("init")) {
        config.initData = await response.json();
      }
    });

    await page.goto(
      `https://game.web-tycoon.com/players/${config.userId}/sites`,
      {
        waitUntil: "networkidle2"
      }
    );

    try {
      await vacation(browser, logger, config);
    } catch (e) {
      logger.error(
        "Ошибка при управление работниками",
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
    // каждые 60 сек
    await new Promise(res => setTimeout(res, 1 * 60 * 1000));
  }
  await browser.close();
};
