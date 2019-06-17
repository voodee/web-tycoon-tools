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

module.exports = async (page, $task, logger) => {
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
  await new Promise(res => setTimeout(res, 200));

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
      await new Promise(res => setTimeout(res, 200));
      logger.info(`Исполнитель ${skill} поставлен на задачу`);
      return;
    }
  }
  // закрываем окно
  do {
    await new Promise(res => setTimeout(res, 1e3));
    await page.waitForSelector(".modalClose");
    await page.click(".modalClose");
    await new Promise(res => setTimeout(res, 1e3));
  } while ((await page.$$(".modalClose")).length > 0);
};
