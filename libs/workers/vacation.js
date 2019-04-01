const axios = require("axios");
const qs = require("qs");

const random = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const HOST = "https://game.web-tycoon.com/api/";
const MAX_IMPORTUNITY = 120;

module.exports = async (
  page,
  logger,
  { token, userId, headers, connectionId, ts, initData, userAgent }
) => {
  logger.info(`Задача по управлению работниками начата`);

  const $linkWorkers = await page.$(".linkWorkers .title");
  await $linkWorkers.click();
  await new Promise(res => setTimeout(res, random(1, 5000)));
  await page.waitForSelector(".grid");

  let $workers = await page.$$(".grid .cardContainer");
  for (let workerNumber = 0; workerNumber < $workers.length; ++workerNumber) {
    try {
      await new Promise(res => setTimeout(res, random(1, 5000)));
      const $linkWorkers = await page.$(".linkWorkers .title");
      await $linkWorkers.click();
      await new Promise(res => setTimeout(res, random(1, 5000)));
      await page.waitForSelector(".grid");
      $workers = await page.$$(".grid .cardContainer");
      const $worker = $workers[workerNumber];

      await $worker.click();
      await page.waitForSelector(".infoBlock");

      for ($button of await page.$$(
        "footer button.cardBottom:not(.buttonDisabled)"
      )) {
        const text = await (await $button.getProperty(
          "textContent"
        )).jsonValue();
        if (/Заплатить/gi.test(text)) {
          await $button.click();
          logger.info(`Заплатили работнику ${workerNumber}`);
        }
      }

      const isWork = (await page.$$(".workingStatus.profile")).length > 0;
      if (isWork) {
        logger.info(`Работник ${workerNumber} ещё работает над задачей`);
        continue;
      }

      const isExtraEnergy = await page.$(".extraEnergy");
      if (isExtraEnergy) {
        logger.info(`У работника ${workerNumber} ещё очень много энергии`);
        continue;
      }

      const $energy = await page.$(".progressBar.energy");
      const energyWidthSource = await $energy.getProperty("offsetWidth");
      const energyWidth = await energyWidthSource.jsonValue();

      const $energyBar = await page.$(".energyBar");
      const energyBarWidthSource = await $energyBar.getProperty("offsetWidth");
      const energyBarWidth = await energyBarWidthSource.jsonValue();
      if (energyWidth / energyBarWidth > 0.05) {
        logger.info(`У работника ${workerNumber} ещё много энергии`);
        continue;
      }

      for ($button of await page.$$("footer button.cardBottom")) {
        const text = await (await $button.getProperty(
          "textContent"
        )).jsonValue();
        if (/отдох/gi.test(text)) {
          await $button.click();
          logger.info(`Работник ${workerNumber} отправлен в отпуск`);
        }
      }
    } catch (e) {
      logger.error(`Ошибка при управление работником ${workerNumber}`, e);
    }
  }

  logger.info(`Задача по отправке работников в отпуск закончена`);
};
