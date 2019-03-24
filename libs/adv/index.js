const puppeteer = require("puppeteer");
const auth = require("../../helpers/auth");
const make = require("./make");
const clearSmallSize = require("./clear-small-size");
const clearBadTheme = require("./clear-bad-theme");
const enable = require("./enable");

module.exports = async (logger, { userAgent }) => {
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
  let config = {
    userAgent,
    ...(await auth(browser, { userAgent }))
  };

  while (1) {
    try {
      // поиск рекламы
      await make(browser, logger, config);
    } catch (e) {
      logger.error(
        "Ошибка поиска рекламы",
        (e && e.response && e.response.data) || e
      );
      if (e.error && e.error.code === "AUTHORIZATION_REQUIRED") {
        config = {
          userAgent,
          ...(await auth(browser, { userAgent }))
        };
      }
    }

    try {
      // очистка рекламы с низкой конверсией
      await clearSmallSize(browser, logger, config);
    } catch (e) {
      logger.error(
        "Ошибка очистки рекламы с низкой конверсией",
        (e && e.response && e.response.data) || e
      );
      if (e.error && e.error.code === "AUTHORIZATION_REQUIRED") {
        config = {
          userAgent,
          ...(await auth(browser, { userAgent }))
        };
      }
    }

    try {
      // очистка не тематической рекламы
      await clearBadTheme(browser, logger, config);
    } catch (e) {
      logger.error(
        "Ошибка очистки не тематической рекламы",
        (e && e.response && e.response.data) || e
      );
      if (e.error && e.error.code === "AUTHORIZATION_REQUIRED") {
        config = {
          userAgent,
          ...(await auth(browser, { userAgent }))
        };
      }
    }

    try {
      // включение рекламы
      await enable(browser, logger, config);
    } catch (e) {
      logger.error(
        "Ошибка включение рекламы",
        (e && e.response && e.response.data) || e
      );
      if (e.error && e.error.code === "AUTHORIZATION_REQUIRED") {
        config = {
          userAgent,
          ...(await auth(browser, { userAgent }))
        };
      }
    }
    // каждые 30 сек
    await new Promise(res => setTimeout(res, 30 * 1000));
  }

  await browser.close();
};
