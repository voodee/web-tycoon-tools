const puppeteer = require("puppeteer");
const auth = require("../../helpers/auth");
const make = require("./make");

const goToLastSite = async (page, config) => {
  await page.goto(
    `https://game.web-tycoon.com/players/${config.userId}/sites`,
    {
      waitUntil: "networkidle2"
    }
  );
  await page.waitForSelector(".siteCard");

  // переходим на страницу сайтов
  await page.waitForSelector(".linkSites  .title");
  await new Promise(res => setTimeout(res, 1000));
  const $linkSites = await page.$(".linkSites  .title");
  await $linkSites.click();

  // // считаем количество сайтов
  // const siteCount = (await page.$$(".siteCard")).length;

  // переходим на последний сайт
  await page.waitForSelector(".siteCard");
  await new Promise(res => setTimeout(res, 1000));
  let $sites = await page.$$(".siteCard");
  await $sites[0].click();
  await page.waitForSelector(".prevNextNavGroup .leftArrow");
};

module.exports = async (browser, logger, config) => {
  const page = await browser.newPage();

  // Автологин начало
  let siteIdLast;
  (async () => {
    while (1) {
      try {
        await page.waitForNavigation();
        const url = page.url();
        if (/.+\/players\/.+\/sites\/.+/.test(url)) {
          siteIdLast = url.split("/").pop();
        }
        if (url === "https://game.web-tycoon.com/") {
          logger.error("Разлогинило(");
          try {
            config = {
              ...config,
              ...(await auth(browser, config))
            };
          } catch (e) {}
          (async () => {
            if (!siteIdLast) {
              await goToLastSite(page, config);
              return;
            }

            await page.goto(
              `https://game.web-tycoon.com/players/${
                config.userId
              }/sites/${siteIdLast}`,
              {
                waitUntil: "networkidle2"
              }
            );
            await page.waitForSelector(".siteCard");
          })();
        }
        // if (!url.includes("game.web-tycoon.com")) {
        //   logger.error("Жопа(");
        //   await goToLastSite(page, config);
        //   return;
        // }
      } catch (e) {}
    }
  })();
  // Автологин конец

  // Ежедневная награда начало
  (async () => {
    while (1) {
      try {
        const $dailyBonusButton = await page.$(".dailyBonus .baseButton");
        if ($dailyBonusButton) {
          await $dailyBonusButton.click();
        }
      } catch (e) {}
      await new Promise(res => setTimeout(res, 1e4));
    }
  })();
  // Ежедневная награда конец

  // Потеря интернета начало
  (async () => {
    while (1) {
      try {
        const $noConnection = await page.$(".noConnection");
        if ($noConnection) {
          await page.reload();
        }
      } catch (e) {}
      await new Promise(res => setTimeout(res, 1e4));
    }
  })();
  // Потеря интернета конец

  // любой пиздец начало
  (async () => {
    while (1) {
      await new Promise(res => setTimeout(res, 1e4));
      try {
        const url = page.url();

        if (!url.includes("game.web-tycoon.com")) {
          logger.error("Пиздец(");
          await goToLastSite(page, config);
        }
      } catch (e) {}
    }
  })();
  // любой пиздец конец

  let isPause = false;
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

  let initData;
  page.on("response", async response => {
    const url = response.url();
    if (url.includes("init")) {
      // получаем сайты пользователя
      try {
        initData = await response.json();
      } catch (e) {}
    }
  });

  await goToLastSite(page, config);

  while (1) {
    try {
      await make(page, logger, { ...config, initData });
      await page.reload();
    } catch (e) {
      logger.error(
        "Ошибка при управление тасками",
        page.url(),
        (e && e.response && e.response.data) || e
      );
    }
    // каждые 5 сек
    await new Promise(res => setTimeout(res, 5 * 1000));
  }

  await page.close();
};
