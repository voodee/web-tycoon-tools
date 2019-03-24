const puppeteer = require("puppeteer");
const auth = require("../../helpers/auth");
const vacation = require("./vacation");

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
      await vacation(browser, logger, config);
    } catch (e) {
      logger.error(
        "Ошибка при управление работниками",
        (e && e.response && e.response.data) || e
      );
      if (e.error && e.error.code === "AUTHORIZATION_REQUIRED") {
        config = {
          userAgent,
          ...(await auth(browser, { userAgent }))
        };
      }
    }
    // каждые 60 сек
    await new Promise(res => setTimeout(res, 1 * 60 * 1000));
  }
  await browser.close();
};
