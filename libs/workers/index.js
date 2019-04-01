const puppeteer = require("puppeteer");
const auth = require("../../helpers/auth");
const vacation = require("./vacation");

module.exports = async (browser, logger, config) => {
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on("request", async request => {
    const url = new URL(request.url());
    if (url.host !== "game.web-tycoon.com") {
      request.abort();
      return;
    }
    request.continue();
  });

  const width = 1196;
  const height = 820;
  await page.emulate({
    userAgent: config.userAgent,
    viewport: {
      width,
      height
    }
  });

  while (1) {
    try {
      await page.goto(
        `https://game.web-tycoon.com/players/${config.userId}/workers`,
        {
          waitUntil: "networkidle2"
        }
      );
      await page.waitForSelector(".grid");
      await vacation(page, logger, config);
      await page.reload();
    } catch (e) {
      logger.error(
        "Ошибка при управление работниками",
        (e && e.response && e.response.data) || e
      );
    }

    // каждые 60 сек
    await new Promise(res => setTimeout(res, 1 * 60 * 1000));
  }

  await page.close();
};
