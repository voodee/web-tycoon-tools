const MAX_IMPORTUNITY = 120;

module.exports = async (page, logger, config) => {
  const site = config.initData.sites[config.siteNumber];

  // вычисляем сумму назойливости
  const importunities = site.ad.map(ad => ad.importunity);

  const importunitiesSum = importunities.reduce(
    (accumulator, importunity) => accumulator + importunity,
    0
  );

  // если назойливость уже высокая, то ничего не делаем
  if (importunitiesSum > MAX_IMPORTUNITY) {
    return;
  }
  // если достигли лимита, то ничего не делаем
  if (site.ad.length >= site.adSlots) {
    return;
  }

  const $buttonSearch = await page.$(
    "button.adSearchButton:not(.buttonDisabled) span"
  );

  const isSearch = !!(await page.$(
    "button.adSearchButton:not(.buttonDisabled) .adSearchProgress"
  ));

  if (!$buttonSearch || isSearch) {
    return;
  }

  await new Promise(res => setTimeout(res, 200));
  await $buttonSearch.click();
  await new Promise(res => setTimeout(res, 200));

  await page.waitForSelector(".popupPortal .offerCard");

  const $offerCards = await page.$$(
    ".popupPortal .offerCard:not(.offerDisabledCard)"
  );

  // если назойливость маленькая, то ищем мощную рекламу - "Поискать в интернете"
  if (importunitiesSum < 50 && $offerCards.length > 1) {
    await $offerCards[1].click();
    logger.info(`Ищем мощную рекламу для сайта`);
    await new Promise(res => setTimeout(res, 3 * 1000));
    return;
  }

  // иначе ищем слабую рекламу
  await $offerCards[0].click();
  logger.info(`Ищем слабую рекламу для сайта`);
  await new Promise(res => setTimeout(res, 3 * 1000));
};
