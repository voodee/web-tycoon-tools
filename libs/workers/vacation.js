const axios = require("axios");
const qs = require("qs");

const HOST = "https://game.web-tycoon.com/api/";
const MAX_IMPORTUNITY = 120;

module.exports = async (browser, logger) => {
  logger.info(`Задача по отправке работников в отпуск начата`);

  const page = await browser.newPage();
  await page.goto("https://game.web-tycoon.com/", {
    waitUntil: "networkidle2"
  });

  const token = await page.evaluate(() => localStorage.token);
  const userId = await page.evaluate(() => localStorage.userId);
  await page.close();

  // получаем сайты пользователя
  const {
    data: { workers }
  } = await axios.get(`${HOST}users/${userId}/init?access_token=${token}`);

  for (let workerNumber = 0; workerNumber < workers.length; ++workerNumber) {
    const { id, status, energyValue } = workers[workerNumber];

    if (
      // если работник не работает
      status === 1 &&
      // и у него энергии меньше 5%
      energyValue < 5
    ) {
      await axios.post(
        `${HOST}workers/${userId}/vacation/send/${id}?access_token=${token}`
      );
      logger.info(`Работник ${id} отправлен в отпуск`);
    }
  }

  logger.info(`Задача по отправке работников в отпуск закончена`);
};
