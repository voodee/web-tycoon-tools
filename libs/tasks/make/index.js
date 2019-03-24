const tasks = require("./tasks");
const content = require("./content");
const publish = require("./publish");

const random = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

module.exports = async (browser, logger, config) => {
  const {
    token,
    userId,
    connectionId,
    ts,
    headers,
    initData,
    userAgent
  } = config;
  logger.info(`Задача по управлению задачами начата`);
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

  await page.goto(`https://game.web-tycoon.com/players/${userId}/sites`, {
    waitUntil: "networkidle2"
  });

  // Двигаем курсором, чтобы нас не заподозрили
  // (async () => {
  //   while (1) {
  //     await page.mouse.move(
  //       Math.floor(Math.random() * width) + 1,
  //       Math.floor(Math.random() * height) + 1
  //     );
  //     await new Promise(res => setTimeout(res, random(1, 1000)));
  //   }
  // })();

  await page.waitForSelector(".siteCard");
  await new Promise(res => setTimeout(res, random(1000, 5000)));

  for (let site of initData.sites) {
    try {
      const $linkSites = await page.$(".linkSites");
      await $linkSites.click();
      await page.waitForSelector(".siteCard");
      let $sites = (await page.$$(".siteCard")).reverse();
      logger.info(`Открываем сайт ${site.domain}`);
      const siteNumber = initData.sites.indexOf(site);

      await $sites[siteNumber].click();

      await page.waitForSelector(".aboutWr");
      logger.info(`Перешли на сайт ${site.domain}`);
      await new Promise(res => setTimeout(res, random(1000, 5000)));

      // Таски
      logger.info(`Управляем тасками на сайте ${site.domain}`);
      try {
        const tasksStatus = await tasks(page, logger, {
          siteId: site.id,
          ...config
        });
        if (tasksStatus) {
          logger.info(`низкая империя`);
          break;
        }
      } catch (e) {
        logger.error(
          `Ошибка управления тасками`,
          (e.response && e.response.data) || e
        );
      }
      await new Promise(res => setTimeout(res, random(1000, 5000)));

      logger.info(`Управляем контентом на сайте ${site.domain}`);
      // Контент
      try {
        const contentStatus = await content(page, logger);
        if (contentStatus) {
          logger.info(`низкая империя`);
          break;
        }
      } catch (e) {
        logger.error(
          `Ошибка управления контентом`,
          (e.response && e.response.data) || e
        );
      }
      await new Promise(res => setTimeout(res, random(1000, 5000)));

      // Публикация
      try {
        logger.info(`Управляем публикацией на сайте ${site.domain}`);
        await publish(page, logger);
      } catch (e) {
        logger.error(
          `Ошибка управления публикацией`,
          (e.response && e.response.data) || e
        );
      }
    } catch (e) {
      logger.error(`Ошибка управления сайтом`, e);
    }
  }

  await page.close();
  await new Promise(res => setTimeout(res, 2 * 1000));
  logger.info(`Задача по управлению задачами закончена`);
};
