const MAX_IMPORTUNITY = 120;

module.exports = async (page, logger) => {
  // вычисляем сумму назойливости
  const importunities1 = (await page.$$(".round-1")).length / 3;
  const importunities2 = (await page.$$(".round-2")).length / 3;
  const importunities3 = (await page.$$(".round-3")).length / 3;

  const importunitiesSum =
    importunities1 * 12 + importunities2 * 41 + importunities3 * 100;

  // если назойливость уже высокая, то ничего не делаем
  if (importunitiesSum > MAX_IMPORTUNITY) {
    return;
  }

  const $buttonSearch = await page.$(
    "button.adSearchButton:not(.buttonDisabled) span"
  );

  const isSearch = !!(await page.$(
    "button.adSearchButton:not(.buttonDisabled) .adSearchProgress"
  ));

  if (
    // если достигли лимита, то ничего не делаем
    !$buttonSearch ||
    // или идёт поиск рекламы
    isSearch
  ) {
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
  if (importunitiesSum < 55 && $offerCards.length > 1) {
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
