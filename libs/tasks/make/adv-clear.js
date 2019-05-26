const remove = async (page, $card) => {
  const $remove = await $card.$(".removeItemIcon");
  await $remove.click();
  await page.waitForSelector(".popupContent .defaultBtn");
  await new Promise(res => setTimeout(res, 1 * 1000));
  const $removeConfirm = await page.$(".popupContent .defaultBtn");
  await $removeConfirm.click();
  await new Promise(res => setTimeout(res, 1 * 1000));
};

module.exports = async (page, logger) => {
  await page.waitForSelector(".panelWrapper .tabWrapper .tab");

  await page.click(".panelWrapper .tabWrapper .tab:nth-child(1)");

  await page.waitForSelector(
    ".panelWrapper .tabWrapper .tab.activeTab:nth-child(1)"
  );

  const sitethemeId = await page.$eval(
    ".panelSection .previewTitle .cardLabel",
    (el, attribute) => el.getAttribute(attribute),
    "data-hint"
  );

  const $cards = await page.$$(".adWr .grid .itemWr:not(.offersAd)");

  for (let cardNumber = 0; cardNumber < $cards.length; ++cardNumber) {
    const $card = $cards[cardNumber];
    // const cardСlassName = await $cards.getProperty("className");
    const cardСlassName = await page.evaluate(el => [...el.classList], $card);

    const adthemeId = await $card.$eval(
      ".cardLabel",
      (el, attribute) => el.getAttribute(attribute),
      "data-hint"
    );

    // logger.info(`удаляем не тематическую рекламу`);
    // если категория общая, то оставляем всю рекламу
    if (sitethemeId !== "Общая") {
      if (adthemeId !== sitethemeId) {
        await remove(page, $card);
        logger.info(`Удалена не тематическая реклама с сайта`);
        continue;
      }
    } else {
      logger.info(`сайт общей категории`);
    }
    await new Promise(res => setTimeout(res, 200));

    // logger.info(`включаем выключенную рекламу`);
    // if (ad.status === 0) {
    if (cardСlassName.includes("inactiveAd")) {
      const $toggler = await $card.$(".adCardFooter .toggler");
      await $toggler.click();
      await new Promise(res => setTimeout(res, 1 * 1000));
      logger.info(`Включена реклама с сайта`);
      continue;
    }

    // logger.info(`удаляем рекламу с низкой конверсией`);
    const $stats = await $card.$$(".statsWr");
    const $stat = $stats[2];
    const text = await (await $stat.getProperty("textContent")).jsonValue();
    const adConv = parseFloat(text.replace(",", "."));

    // вычисляем сумму назойливости
    const importunities1 = (await page.$$(".round-1")).length / 3;
    const importunities2 = (await page.$$(".round-2")).length / 3;
    const importunities3 = (await page.$$(".round-3")).length / 3;
    const importunitiesSum =
      importunities1 * 12 + importunities2 * 41 + importunities3 * 100;

    const cardImportunities1 = (await $card.$$(".round-1")).length / 3;
    const cardImportunities2 = (await $card.$$(".round-2")).length / 3;
    const cardImportunities3 = (await $card.$$(".round-3")).length / 3;

    logger.info("Конверсия", adConv);
    const confDown =
      cardImportunities1 * 0 +
      cardImportunities2 * 10 +
      cardImportunities3 * 40;
    logger.info("Коэфициэент понижения", confDown);
    const minConv = Math.min(
      (270.0 - confDown) / Math.max(importunitiesSum, 100 + 12 + 12),
      3.1
    );
    logger.info("Минимальная конверсия", minConv);
    if (adConv < minConv) {
      await remove(page, $card);
      logger.info(`Удалена реклама с низкой конверсией ${adConv} с сайта`);
      continue;
    }

    // await new Promise(res => setTimeout(res, 1 * 1000));
  }
};
