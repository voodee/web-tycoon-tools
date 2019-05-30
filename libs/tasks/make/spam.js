module.exports = async (page, logger) => {
  await page.waitForSelector(".tabWrapper .tab:nth-child(1)");
  await new Promise(res => setTimeout(res, 1e3));
  await page.click(".tabWrapper .tab:nth-child(1)");

  await page.waitForSelector(".externalLinkWr");
  const buttonsSpam = await page.$$(".button-spam");
  if (buttonsSpam.length < 1) {
    logger.info(`На сайте не найдено спама`);
    return;
  }
  await page.click(".button-spam");
  await page.waitForSelector(".siteComments");
  await new Promise(res => setTimeout(res, 200));
  const [, , $buttonRemove] = await page.$$(".externalLinkWr button");
  // :(
  await new Promise(res => setTimeout(res, 200));
  await $buttonRemove.click();
  await new Promise(res => setTimeout(res, 200));
  logger.info(`На сайте удалена реклама`);
};
