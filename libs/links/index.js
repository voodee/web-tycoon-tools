const puppeteer = require("puppeteer");
const auth = require("../../helpers/auth");
const deleteAction = require("./delete");
const setAction = require("./set");

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
        // удаляем спамные сслыки
        try {
          await deleteAction(browser, logger, config);
        } catch (e) {
          logger.error(
            "Ошибка при удаление спамных ссылок",
            e && e.response && e.response.data
          );
        }
        await browser.close();
        // каждые 10 сек
        await new Promise(res => setTimeout(res, 10 * 1000));
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
        // ставим спамные ссылки
        try {
          await setAction(browser, logger, config);
        } catch (e) {
          logger.error(
            "Ошибка при установки спамных ссылок",
            e && e.response && e.response.data
          );
        }
        await browser.close();
        // каждые 1 минут
        await new Promise(res => setTimeout(res, 1 * 1000));
      }
    })()
  ]);
};
