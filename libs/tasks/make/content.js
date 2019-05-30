const findWorker = require("./helpers/findWorker");

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

module.exports = async (page, logger) => {
  /**
   * Контент
   **/
  logger.info(`Смотрим контент`);
  // готовый контент
  let $goodContent = 0;
  let numberTry = 0;
  do {
    await new Promise(res => setTimeout(res, 1000));
    $goodContent = await page.$$(".contentTypesWr .item .cardContainer");
    ++numberTry;
  } while (
    $goodContent.length > 4 ||
    ($goodContent.length > 4 && numberTry < 10)
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
    return true;
  } else {
    // иначе ищем работника
    await findWorker(page, $taskMarketing, logger);
  }

  // есть ли активный контент
  const isActiveContent = (await page.$$("#content-score-receiver .effectCard"))
    .length;

  if (
    // если нет активного контента
    !isActiveContent &&
    // но есть готовый контен
    $goodContent.length > 0
  ) {
    // то публикуем

    await page.click(".panelWrapper .tabWrapper .tab:nth-child(1)");
    await page.waitForSelector(".externalLinkWr .baseButton:first-child");
    await page.click(".externalLinkWr .baseButton:first-child");

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
      const countType = (comments.match(new RegExp(type, "g")) || []).length;
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
  }
};
