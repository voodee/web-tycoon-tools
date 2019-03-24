const axios = require("axios");
const qs = require("qs");

const HOST = "https://game.web-tycoon.com/api/";
const MAX_IMPORTUNITY = 120;

module.exports = async (
  browser,
  logger,
  { token, userId, headers, connectionId, ts, initData }
) => {
  logger.info(`Задача по отправке работников в отпуск начата`);

  const workers = initData.workers;

  for (let workerNumber = 0; workerNumber < workers.length; ++workerNumber) {
    const { id, status, energyValue } = workers[workerNumber];

    if (
      // если работник не работает
      status === 1 &&
      // и у него энергии меньше 5%
      energyValue < 5
    ) {
      await axios.post(
        `${HOST}workers/${userId}/vacation/send/${id}?access_token=${token}&connectionId=${connectionId}&ts=${ts}`,
        qs.stringify({
          connectionId,
          ts
        }),
        { headers }
      );
      logger.info(`Работник ${id} отправлен в отпуск`);
    }
  }

  logger.info(`Задача по отправке работников в отпуск закончена`);
};
