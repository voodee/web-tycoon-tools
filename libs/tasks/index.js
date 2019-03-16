const evaluate = require("./evaluate");

module.exports = async (browser, logger) => {
  const page = await browser.newPage();
  await page.goto("https://game.web-tycoon.com/", {
    waitUntil: "networkidle2"
  });

  while (true) {
    try {
      await page.addScriptTag({
        url: "https://code.jquery.com/jquery-3.3.1.min.js"
      });
      await new Promise(res => setTimeout(res, 2 * 1000));
      const result = await page.evaluate(evaluate);
      logger.log(result);
      await page.reload();
    } catch (e) {
      logger.error(e);
    }
    await new Promise(res => setTimeout(res, 10 * 1000));
  }
};
