const tasks = require("./tasks");
const content = require("./content");
const publish = require("./publish");
const spam = require("./spam");
const advClear = require("./adv-clear");
const advFind = require("./adv-find");
const pay = require("./pay");

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

  let siteNumber = 0;
  while (1) {
    try {
      ++siteNumber;
      await new Promise(res => setTimeout(res, 500));
      try {
        await page.waitForSelector(".prevNextNavGroup .leftArrow");
      } catch (e) {
        await page.reload();
        continue;
      }
      await new Promise(res => setTimeout(res, 500));
      await (await page.$(".prevNextNavGroup .leftArrow")).click();

      const $siteName = await page.$(".subNavLeftGroup span:last-child");
      const siteName = await (await $siteName.getProperty(
        "textContent"
      )).jsonValue();
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
          page.url(),
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
          page.url(),
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
          page.url(),
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
          page.url(),
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
          page.url(),
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
          page.url(),
          (e.response && e.response.data) || e
        );
      }

      // Оплата домена и хостинга
      try {
        logger.info(`Оплата хостинга и домена на сайте ${siteName}`);
        await pay(page, logger);
      } catch (e) {
        logger.error(
          `Ошибка оплаты хостинга и домена`,
          page.url(),
          (e.response && e.response.data) || e
        );
      }

      await new Promise(res => setTimeout(res, random(1, 200)));
    } catch (e) {
      logger.error(`Ошибка управления сайтом`, page.url(), e);
    }

    if ((siteNumber + 1) % 20 === 0) await page.reload();
  }

  logger.info(`Задача по управлению задачами закончена`);
};
