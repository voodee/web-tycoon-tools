const puppeteer = require("puppeteer");
const auth = require("../../helpers/auth");
const make = require("./make");

module.exports = async logger => {
  await Promise.all([
    (async () => {
      while (1) {
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-background-timer-throttling",
            "--disable-renderer-backgrounding",
            "--override-plugin-power-saver-for-testing=never",
            "--disable-extensions-http-throttling"
          ]
        });
        const config = await auth(browser);
        try {
          await make(browser, logger, config);
        } catch (e) {
          logger.error(
            "Ошибка при управление тасками",
            (e && e.response && e.response.data) || e
          );
        }
        await browser.close();
        // каждые 5 сек
        await new Promise(res => setTimeout(res, 5 * 1000));
      }
    })()
  ]);
};
