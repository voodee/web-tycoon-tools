module.exports = async (page, logger) => {
  await page.waitForSelector(".panelWrapper .tabWrapper .tab");

  await page.click(".panelWrapper .tabWrapper .tab:nth-child(2)");

  await page.waitForSelector(
    ".panelWrapper .tabWrapper .tab.activeTab:nth-child(2)"
  );

  await new Promise(res => setTimeout(res, 200));

  const $buttons = await page.$$(
    ".domainHostingWrapper button.highlight.highlightPositive"
  );
  for ($button of $buttons) {
    await $button.click();
    await new Promise(res => setTimeout(res, 2 * 1000));
    logger.info(`Оплата произведена`);
  }
};
