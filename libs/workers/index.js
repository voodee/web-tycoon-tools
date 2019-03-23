const puppeteer = require("puppeteer");
const auth = require("../../helpers/auth");
const vacation = require("./vacation");

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
          await vacation(browser, logger);
        } catch (e) {
          logger.error(
            "Ошибка при управление работниками",
            e && e.response && e.response.data
          );
        }
        await browser.close();
        // каждые 60 сек
        await new Promise(res => setTimeout(res, 1 * 60 * 1000));
      }
    })()
  ]);
};
