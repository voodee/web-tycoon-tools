module.exports = async (
  browser,
  logger,
  { token, userId, connectionId, ts, headers }
) => {
  logger.info(`Задача по удалению спама начата`);
  const page = await browser.newPage();

  await page.goto(`https://game.web-tycoon.com/players/${userId}/sites`, {
    waitUntil: "networkidle2"
  });
  await page.waitForSelector(".siteCard");

  try {
    let sites = await page.$$(".siteCard");
    for (let siteNumber = 0; siteNumber < sites.length; ++siteNumber) {
      await page.click(`.linkSites`);
      await page.waitForSelector(".siteCard");
      // :(
      await new Promise(res => setTimeout(res, 1 * 1000));
      let sites = await page.$$(".siteCard");
      logger.info(`Ищем спам на сайте ${siteNumber}`);
      // :(
      await new Promise(res => setTimeout(res, 1 * 1000));
      await sites[siteNumber].click();
      await page.waitForSelector(".aboutWr");

      await page.click(`.tabWrapper .tab:nth-child(1)`);

      await page.waitForSelector(".externalLinkWr");
      const buttonsSpam = await page.$$(".button-spam");
      if (buttonsSpam.length < 1) {
        logger.info(`На сайте ${siteNumber} не найдено спама`);
        continue;
      }
      await page.click(".button-spam");
      await page.waitForSelector(".siteComments");
      const [, , buttonRemove] = await page.$$(".externalLinkWr button");
      // :(
      await new Promise(res => setTimeout(res, 1 * 1000));
      await buttonRemove.click();
      await new Promise(res => setTimeout(res, 1 * 1000));
      logger.info(`На сайте ${siteNumber} удалена реклама`);
    }
  } catch (e) {
    logger.error(`Ошибка чистки ссылок`, e);
  }

  await page.close();
  logger.info(`Задача по удалению спама закончена`);
};
