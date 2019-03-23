const MAX_IMPORTUNITY = 120;
const contentTypes = {
  аудио: 1,
  видео: 2,
  стрим: 3,
  фото: 4,
  стат: 5,
  обзор: 6,
  анонс: 7,
  опрос: 8
};

const getMainSkill = async $card => {
  const $scores = await $card.$$(".score");

  let $mainScore = $scores[0];

  for (let $score of $scores) {
    if (
      +(await (await $score.getProperty("textContent")).jsonValue()) >
      +(await (await $mainScore.getProperty("textContent")).jsonValue())
    ) {
      $mainScore = $score;
    }
  }

  const classListSource = await $mainScore.getProperty("classList");
  const classList = await classListSource.jsonValue();
  return classList["1"].replace("score-", "").trim();
};

const findWorker = async (page, $task, logger) => {
  const classListSource = await $task.getProperty("classList");
  const classList = await classListSource.jsonValue();
  const skill = classList["1"];

  const $addWorkerButton = await $task.$(".addWorker:not(.disabled)");
  if (!$addWorkerButton) {
    logger.log(`Исполнитель уже работает над ${skill} или таск заполнен`);
    return;
  }

  await page.evaluate(el => el.click(), $addWorkerButton);
  await page.waitForSelector(".popupPortal");
  // :(
  await new Promise(res => setTimeout(res, 3 * 1000));

  // фильтруем, оставляем только по специальности
  const $cards = await page.$$(".popupPortal .cardContainer:not(.inactive)");
  for (let $card of $cards) {
    const mainSkill = await getMainSkill($card);
    const extraEnergy = await $card.$(".extraEnergy");

    let energyLast = 0;
    if (!extraEnergy) {
      const $energy = await $card.$(".energy");
      const energyWidthSource = await $energy.getProperty("offsetWidth");
      const energyWidth = await energyWidthSource.jsonValue();

      const $energyBar = await $card.$(".energyBar");
      const energyBarWidthSource = await $energyBar.getProperty("offsetWidth");
      const energyBarWidth = await energyBarWidthSource.jsonValue();
      energyLast = energyWidth / energyBarWidth;
    }
    if (
      // если это нужный скилл
      skill === mainSkill &&
      // если у него энергии больше 5%
      (extraEnergy || energyLast > 0.05)
    ) {
      await $card.click();
      await new Promise(res => setTimeout(res, 2 * 1000));
      logger.info(`Исполнитель ${skill} поставлен на задачу`);
      return;
    }
  }
  // закрываем окно
  const $modalClose = await page.$(".modalClose");
  // await page.evaluate(el => el.click(), $modalClose);
  await $modalClose.click();
  await new Promise(res => setTimeout(res, 2 * 1000));
};

module.exports = async (
  browser,
  logger,
  { token, userId, connectionId, ts, headers }
) => {
  logger.info(`Задача по управлению задачами начата`);
  const page = await browser.newPage();

  await page.goto(`https://game.web-tycoon.com/players/${userId}/sites`, {
    waitUntil: "networkidle2"
  });

  await page.waitForSelector(".siteCard");

  try {
    let sites = await page.$$(".siteCard");
    for (let siteNumber = sites.length; siteNumber > 0; --siteNumber) {
      await page.waitForSelector(".linkSites");
      const $linkSites = await page.$(".linkSites");
      await page.evaluate(el => el.click(), $linkSites);
      await page.waitForSelector(".siteCard");
      // :(
      await new Promise(res => setTimeout(res, 1 * 1000));
      let sites = await page.$$(".siteCard");
      logger.info(`Смотрим задачи на сайте ${siteNumber - 1}`);
      // :(
      await new Promise(res => setTimeout(res, 1 * 1000));
      await sites[siteNumber - 1].click();
      await page.waitForSelector(".aboutWr");
      await new Promise(res => setTimeout(res, 1 * 1000));

      /**
       * Таски
       **/
      // проходим по таскам
      let $tasks = await page.$$(".taskItem:not(.marketing)");
      for (let taskNumber = 0; taskNumber < $tasks.length; ++taskNumber) {
        let $tasks = await page.$$(".taskItem:not(.marketing)");
        const $task = $tasks[taskNumber];
        // прогресс
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
        const $cancelTaskButton = await $task.$(".cancelTask");
        if (progressBarWidth === versionProgressWidth && $cancelTaskButton) {
          await page.evaluate(el => el.click(), $cancelTaskButton);
          logger.info(`сняли работника с задачи`);
          siteNumber = 0;
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

          const isDdos = await page.$(".effectCard .debuff");
          const hostingAllow = trafSpeed / hostingLimit < 0.9;

          if (
            // если лимит хостинга позволяет
            hostingAllow &&
            // и сайт не ДДОСят
            !isDdos
          ) {
            // то ставим работника
            await findWorker(page, $task, logger);
          }
        }
        await new Promise(res => setTimeout(res, 2 * 1000));
      }

      /**
       * Контент
       **/
      logger.info(`Смотрим контент`);
      // готовый контент
      const $goodContent = await page.$$(
        ".contentTypesWr .item .cardContainer"
      );

      const $taskMarketing = await page.$(".taskItem.marketing");
      const $cancelTaskMarketingButton = await $taskMarketing.$(".cancelTask");
      if (
        // если готового контнта много
        $goodContent.length === 4 &&
        // и есть человек его делающий
        $cancelTaskMarketingButton
      ) {
        // снимаем человека
        await page.evaluate(el => el.click(), $cancelTaskMarketingButton);
        logger.info(`сняли маркетолога с задачи`);
        siteNumber = 0;
      } else {
        // иначе ищем работника
        await findWorker(page, $taskMarketing, logger);
      }

      // есть ли активный контент
      const isActiveContent = (await page.$$(
        "#content-score-receiver .effectCard"
      )).length;

      if (
        // если нет активного контента
        !isActiveContent &&
        // но есть готовый контен
        $goodContent.length > 0
      ) {
        // то публикуем

        // читаем комментарии
        const comments = await page.evaluate(() => {
          return [
            ...document.querySelectorAll(
              ".commentsList .message.positive, .commentsList .message.neutral"
            )
          ]
            .reduce((acc, el) => acc + el.innerText, "")
            .toLowerCase();
        });
        // считаем, какой контент хочет пользователь
        const contentCost = Object.keys(contentTypes).reduce((acc, type) => {
          const countType = (comments.match(new RegExp(type, "g")) || [])
            .length;
          acc.push([type, countType]);
          return acc;
        }, []);
        const contentCostKeySorted = contentCost
          .sort((a, b) => a[1] - b[1])
          .reverse();

        // смотрим, что есть из готового контента
        const namesContent = [];
        for (let $content of $goodContent) {
          const nameContent = await (await $content.getProperty(
            "textContent"
          )).jsonValue();
          namesContent.push(nameContent);
        }
        const contentIndex1 = namesContent.findIndex(content =>
          new RegExp(contentCostKeySorted[0][0], "ig").test(content)
        );
        const contentIndex2 = namesContent.findIndex(content =>
          new RegExp(contentCostKeySorted[1][0], "ig").test(content)
        );

        let $content4publish = $goodContent[0];
        if (contentIndex1 > -1) {
          $content4publish = $goodContent[contentIndex1];
        } else if (contentIndex2 > -1) {
          $content4publish = $goodContent[contentIndex2];
        }

        await page.evaluate(el => el.click(), $content4publish);
        logger.info("Опубликован контент");
        await new Promise(res => setTimeout(res, 1 * 1000));
      }

      /**
       * Публикуем
       **/
      // проверяем, нужна ли публикация
      const $buttonUpload = await page.$(".versionUpload:not(.buttonDisabled)");
      if ($buttonUpload) {
        await page.evaluate(el => el.click(), $buttonUpload);
        logger.info("Сайт контент");
        await new Promise(res => setTimeout(res, 1 * 1000));
      } else {
        logger.info("Публикация не нужна");
      }
    }
  } catch (e) {
    logger.error(`Ошибка управления задачами`, e);
  }

  await page.close();
  logger.info(`Задача по управлению задачами закончена`);
};
