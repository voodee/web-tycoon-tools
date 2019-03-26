const remove = async (page, $card) => {
  const $remove = await $card.$(".removeItemIcon");
  await $remove.click();
  await page.waitForSelector(".popupContent .defaultBtn");
  await new Promise(res => setTimeout(res, 1 * 1000));
  const $removeConfirm = await page.$(".popupContent .defaultBtn");
  await $removeConfirm.click();
  await new Promise(res => setTimeout(res, 1 * 1000));
};

module.exports = async (page, logger, config) => {
  const site = config.initData.sites[config.siteNumber];

  const $cards = await page.$$(".adWr .grid .itemWr:not(.offersAd)");
  if ($cards.length !== site.ad.length) {
    // это слишком свежая реклама
    logger.info(
      `количество рекламы не совпало ${$cards.length} != ${site.ad.length}`
    );
    return;
  }
  const ads = JSON.parse(JSON.stringify(site.ad));
  for (let cardNumber = 0; cardNumber < $cards.length; ++cardNumber) {
    const $card = $cards[cardNumber];
    const ad = site.ad[cardNumber];

    // logger.info(`удаляем не тематическую рекламу`);
    // если категория общая, то оставляем всю рекламу
    if (site.sitethemeId !== 19) {
      if (ad.adthemeId !== site.sitethemeId) {
        await remove(page, $card);
        logger.info(`Удалена не тематическая реклама с сайта`);
        ads.splice(cardNumber, 1);
        continue;
      }
    } else {
      logger.info(`сайт общей категории`);
    }
    await new Promise(res => setTimeout(res, 200));

    // logger.info(`включаем выключенную рекламу`);
    if (ad.status === 0) {
      const $toggler = await $card.$(".adCardFooter .toggler");
      await $toggler.click();
      logger.info(`Включена реклама с сайта`);
    }
    await new Promise(res => setTimeout(res, 1 * 1000));

    // logger.info(`удаляем рекламу с низкой конверсией`);
    const $stats = await $card.$$(".statsWr");
    const $stat = $stats[2];
    const text = await (await $stat.getProperty("textContent")).jsonValue();
    const adConv = parseFloat(text.replace(",", "."));
    logger.info("Конверсия", adConv);
    if (adConv < 1.8) {
      await remove(page, $card);
      logger.info(`Удалена реклама с низкой конверсией ${adConv} с сайта`);
      ads.splice(cardNumber, 1);
      continue;
    }
    // await new Promise(res => setTimeout(res, 1 * 1000));
  }
  site.ad = ads;
};
