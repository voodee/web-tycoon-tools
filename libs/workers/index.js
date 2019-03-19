const vacation = require("./vacation");

module.exports = async (browser, logger) => {
  await Promise.all([
    (async () => {
      while (1) {
        try {
          await vacation(browser, logger);
        } catch (e) {
          logger.error(
            "Ошибка при управление работниками",
            e && e.response && e.response.data
          );
        }
        // каждые 60 сек
        await new Promise(res => setTimeout(res, 1 * 60 * 1000));
      }
    })()
  ]);
};
