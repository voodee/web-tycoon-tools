const tasks = require("./tasks");
const content = require("./content");
const publish = require("./publish");
const spam = require("./spam");
const advClear = require("./adv-clear");
const advFind = require("./adv-find");

const random = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

module.exports = async (page, logger, config) => {
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

  await page.waitForSelector(".linkSites  .title");
  const $linkSites = await page.$(".linkSites  .title");
  await $linkSites.click();
  await page.waitForSelector(".siteCard");
  const siteCount = (await page.$$(".siteCard")).length;

  for (let siteNumber = 0; siteNumber < siteCount; ++siteNumber) {
    try {
      await page.waitForSelector(".linkSites  .title");
      const $linkSites = await page.$(".linkSites  .title");
      await $linkSites.click();
      await page.waitForSelector(".siteCard");
      await new Promise(res => setTimeout(res, 1000));
      let $sites = (await page.$$(".siteCard")).reverse();
      const $site = $sites[siteNumber];
      const $siteName = await $site.$(".name");
      const siteName = await (await $siteName.getProperty(
        "textContent"
      )).jsonValue();
      logger.info(`Открываем сайт ${siteName}`);

      await $site.click();

      await page.waitForSelector(".aboutWr");
      logger.info(`Перешли на сайт ${siteName}`);
      await new Promise(res => setTimeout(res, random(1, 200)));

      // Таски
      logger.info(`Управляем тасками на сайте ${siteName}`);
      try {
        const tasksStatus = await tasks(page, logger, {
          ...config
        });
        // if (tasksStatus) {
        //   logger.info(`низкая империя`);
        //   break;
        // }
      } catch (e) {
        logger.error(
          `Ошибка управления тасками`,
          (e.response && e.response.data) || e
        );
      }
      await new Promise(res => setTimeout(res, random(1, 200)));

      logger.info(`Управляем контентом на сайте ${siteName}`);
      // Контент
      try {
        const contentStatus = await content(page, logger);
        // if (contentStatus) {
        //   logger.info(`низкая империя`);
        //   break;
        // }
      } catch (e) {
        logger.error(
          `Ошибка управления контентом`,
          (e.response && e.response.data) || e
        );
      }
      await new Promise(res => setTimeout(res, random(1, 200)));

      // Публикация
      try {
        logger.info(`Управляем публикацией на сайте ${siteName}`);
        await publish(page, logger);
      } catch (e) {
        logger.error(
          `Ошибка управления публикацией`,
          (e.response && e.response.data) || e
        );
      }

      // Спам
      try {
        logger.info(`Очистка спама на сайте ${siteName}`);
        await spam(page, logger, config);
      } catch (e) {
        logger.error(
          `Ошибка очистки спама на сайте`,
          (e.response && e.response.data) || e
        );
      }

      // Реклама
      try {
        logger.info(`Очистка рекламы на сайте ${siteName}`);
        await advClear(page, logger, { ...config, siteNumber });
      } catch (e) {
        logger.error(
          `Ошибка очистки рекламы на сайте`,
          (e.response && e.response.data) || e
        );
      }

      // Реклама
      try {
        logger.info(`Поиск рекламы на сайте ${siteName}`);
        await advFind(page, logger, { ...config, siteNumber });
      } catch (e) {
        logger.error(
          `Ошибка поиска рекламы на сайте`,
          (e.response && e.response.data) || e
        );
      }

      await new Promise(res => setTimeout(res, random(1, 200)));
    } catch (e) {
      logger.error(`Ошибка управления сайтом`, e);
    }
    if ((siteNumber + 1) % 20 === 0) await page.reload();
  }

  logger.info(`Задача по управлению задачами закончена`);
};
