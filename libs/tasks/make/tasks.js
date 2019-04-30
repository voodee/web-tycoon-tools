const findWorker = require("./helpers/findWorker");

const sitesNoTask = (process.env.sites_no_task || "").split(",");

module.exports = async (page, logger, config) => {
  /**
   * Таски
   **/

  // проходим по таскам
  let $tasks = await page.$$(".taskItem:not(.marketing)");
  for (let $task of $tasks) {
    // прогресс
    await page.waitForSelector(".progressBar");
    const $progressBar = await $task.$(".progressBar");
    const progressBarWidthSource = await $progressBar.getProperty(
      "offsetWidth"
    );
    const progressBarWidth = await progressBarWidthSource.jsonValue();
    const $versionProgress = await $task.$(".versionProgress");
    const versionProgressWidthSource = await $versionProgress.getProperty(
      "offsetWidth"
    );
    const versionProgressWidth = await versionProgressWidthSource.jsonValue();

    const $cancelTaskButton = await $task.$(".icon-remove");
    if (progressBarWidth === versionProgressWidth && $cancelTaskButton) {
      // await page.evaluate(
      //   el => el.scrollIntoView({ block: "center" }),
      //   $cancelTaskButton
      // );

      await $cancelTaskButton.click();
      await new Promise(res => setTimeout(res, 200));

      logger.info(`сняли работника с задачи`);
      // низкая империя
      // return true;
    } else {
      // вычисляем лимиты хостинга
      const hostingLimitSource = await (await (await page.$(
        ".hostingLimit"
      )).getProperty("textContent")).jsonValue();
      let hostingLimit = parseFloat(hostingLimitSource.replace(",", "."));
      if (hostingLimitSource.includes("тыс")) {
        hostingLimit *= 1000;
      }

      const trafSpeedSource = await (await (await page.$(
        ".trafSpeed"
      )).getProperty("textContent")).jsonValue();
      let trafSpeed = parseFloat(trafSpeedSource.replace(",", "."));
      if (trafSpeedSource.includes("тыс")) {
        trafSpeed *= 1000;
      }

      // const isDdos = await page.$(".effectCard .debuff");
      // if (isDdos) {
      //   logger.info("Сайт ДДОСят");
      //   continue;
      // }

      const hostingAllow = trafSpeed / hostingLimit < 0.9;
      if (!hostingAllow) {
        logger.info("Сайт достиг лимита хостинга");
        continue;
      }

      const $siteName = await page.$(".subNavLeftGroup span:last-child");
      const siteName = await (await $siteName.getProperty(
        "textContent"
      )).jsonValue();
      if (sitesNoTask.includes(siteName)) {
        logger.info(`Работа над сайтом ${siteName} запрещена настройками`);
        continue;
      }

      await findWorker(page, $task, logger);
    }
  }
};
