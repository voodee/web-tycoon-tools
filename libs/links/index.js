const deleteAction = require("./delete");
const setAction = require("./set");

module.exports = async (browser, logger, config) => {
  await Promise.all([
    (async () => {
      while (1) {
        // удаляем спамные сслыки
        try {
          await deleteAction(browser, logger, config);
        } catch (e) {
          logger.error(
            "Ошибка при удаление спамных ссылок",
            e && e.response && e.response.data
          );
        }
        // каждые 10 сек
        await new Promise(res => setTimeout(res, 10 * 1000));
      }
    })(),
    (async () => {
      while (1) {
        // ставим спамные ссылки
        try {
          await setAction(browser, logger, config);
        } catch (e) {
          logger.error(
            "Ошибка при установки спамных ссылок",
            e && e.response && e.response.data
          );
        }
        // каждые 15 минут
        await new Promise(res => setTimeout(res, 15 * 60 * 1000));
      }
    })()
  ]);
};
