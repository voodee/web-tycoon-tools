const puppeteer = require("puppeteer");
const auth = require("../../helpers/auth");
const make = require("./make");

module.exports = async (browser, logger, config) => {
  const page = await browser.newPage();

  const width = 1196;
  const height = 820;
  await page.emulate({
    userAgent: config.userAgent,
    viewport: {
      width,
      height
    }
  });

  let initData;
  page.on("response", async response => {
    const url = response.url();
    if (url.includes("init")) {
      // получаем сайты пользователя
      initData = await response.json();
    }
  });

  await page.goto(
    `https://game.web-tycoon.com/players/${config.userId}/sites`,
    {
      waitUntil: "networkidle2"
    }
  );
  await page.waitForSelector(".siteCard");

  while (1) {
    try {
      await make(page, logger, { ...config, initData });
      await page.reload();
    } catch (e) {
      logger.error(
        "Ошибка при управление тасками",
        (e && e.response && e.response.data) || e
      );
    }
    // каждые 5 сек
    await new Promise(res => setTimeout(res, 5 * 1000));
  }

  await page.close();
};
