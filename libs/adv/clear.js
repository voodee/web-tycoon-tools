const remove = async (page, $card) => {
  const $remove = await $card.$(".removeItemIcon");
  await $remove.click();
  await page.waitForSelector(".popupContent .defaultBtn");
  await new Promise(res => setTimeout(res, 3 * 1000));
  const $removeConfirm = await page.$(".popupContent .defaultBtn");
  await $removeConfirm.click();
  await new Promise(res => setTimeout(res, 1 * 1000));
};

module.exports = async (
  browser,
  logger,
  { token, userId, userAgent, initData }
) => {
  logger.info(`смотрим рекламу`);
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
  await page.waitForSelector(".siteCard");

  let $sites = (await page.$$(".siteCard")).reverse();
  const sites = initData.sites.reverse();
  for (let siteNumber = $sites.length; siteNumber > 0; --siteNumber) {
    await page.waitForSelector(".linkSites");
    const $linkSites = await page.$(".linkSites");
    await page.evaluate(el => el.click(), $linkSites);
    await page.waitForSelector(".siteCard");
    // :(
    await new Promise(res => setTimeout(res, 1 * 1000));
    $sites = await page.$$(".siteCard");
    logger.info(`Смотрим рекламу на сайте ${siteNumber - 1}`);
    // :(
    await new Promise(res => setTimeout(res, 1 * 1000));
    const $site = $sites[siteNumber - 1];
    const site = sites[siteNumber - 1];
    await $site.click();
    await page.waitForSelector(".aboutWr");
    await new Promise(res => setTimeout(res, 1 * 1000));

    /////
    const $cards = await page.$$(".adWr .grid .itemWr:not(.offersAd)");
    for (let cardNumber = 0; cardNumber < $cards.length; ++cardNumber) {
      const $card = $cards[cardNumber];
      const ad = site.ad[cardNumber];

      logger.info(`удаляем не тематическую рекламу`);
      // если категория общая, то оставляем всю рекламу
      if (ad && site.sitethemeId !== 19) {
        if (ad.adthemeId !== site.sitethemeId) {
          await remove(page, $card);
          logger.info(`Удалена не тематическая реклама с сайта ${siteNumber}`);
          continue;
        }
      } else {
        logger.info(`сайт общей категории`);
      }
      // await new Promise(res => setTimeout(res, 1 * 1000));

      logger.info(`включаем выключенную рекламу`);
      if (ad && ad.status === 0) {
        const $toggler = await $card.$(".adCardFooter .toggler");
        await $toggler.click();
        logger.info(`Включена реклама с сайта ${siteNumber}`);
      }
      await new Promise(res => setTimeout(res, 1 * 1000));

      logger.info(`удаляем рекламу с низкой конверсией`);
      const $stats = await $card.$$(".statsWr");
      const $stat = $stats[2];
      const text = await (await $stat.getProperty("textContent")).jsonValue();
      const adConv = parseFloat(text.replace(",", "."));
      logger.info("Конверсия", adConv);
      if (adConv < 1.5) {
        await remove(page, $card);
        logger.info(
          `Удалена реклама с низкой конверсией ${adConv} с сайта ${siteNumber}`
        );
        continue;
      }
      // await new Promise(res => setTimeout(res, 1 * 1000));
    }
  }
  await page.close();
};
