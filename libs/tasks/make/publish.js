module.exports = async (page, logger) => {
  /**
   * Публикуем
   **/
  // проверяем, нужна ли публикация
  const $buttonUpload = await page.$(".versionUpload:not(.buttonDisabled)");
  if ($buttonUpload) {
    await page.evaluate(el => el.click(), $buttonUpload);
    logger.info("Сайт опубликован");
    await new Promise(res => setTimeout(res, 200));
  } else {
    logger.info("Публикация не нужна");
  }
};
