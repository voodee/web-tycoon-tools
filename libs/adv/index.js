const puppeteer = require("puppeteer");
const auth = require("../../helpers/auth");
const make = require("./make");
const clearSmallSize = require("./clear-small-size");
const clearBadTheme = require("./clear-bad-theme");
const enable = require("./enable");

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
            "Ошибка при поиске рекламы",
            (e && e.response && e.response.data) || e
          );
        }
        await browser.close();
        // каждые 30 сек
        await new Promise(res => setTimeout(res, 30 * 1000));
      }
    })(),
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
          await clearSmallSize(browser, logger, config);
        } catch (e) {
          logger.error(
            "Ошибка при очистке рекламы с низкой конверсией",
            (e && e.response && e.response.data) || e
          );
        }
        await browser.close();
        // каждые 30 сек
        await new Promise(res => setTimeout(res, 30 * 1000));
      }
    })(),
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
          await clearBadTheme(browser, logger, config);
        } catch (e) {
          logger.error(
            "Ошибка при очистке не тематической рекламы",
            (e && e.response && e.response.data) || e
          );
        }
        await browser.close();
        // каждые 30 сек
        await new Promise(res => setTimeout(res, 30 * 1000));
      }
    })(),
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
          await enable(browser, logger, config);
        } catch (e) {
          logger.error(
            "Ошибка при включение выключенной рекламы",
            (e && e.response && e.response.data) || e
          );
        }
        await browser.close();
        // каждые 30 сек
        await new Promise(res => setTimeout(res, 30 * 1000));
      }
    })()
  ]);
};
