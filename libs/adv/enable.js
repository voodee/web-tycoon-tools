const axios = require("axios");
const qs = require("qs");

const HOST = "https://game.web-tycoon.com/api/";
const MAX_IMPORTUNITY = 120;

module.exports = async (
  browser,
  logger,
  { token, userId, headers, initData, connectionId, ts }
) => {
  logger.info(`Задача по включению рекламы начата`);

  const userSites = initData.sites;

  // // Включаем выключенную рекламу
  logger.info(`Включаем выключенную рекламу`);
  for (let siteNumber = 0; siteNumber < userSites.length; ++siteNumber) {
    const site = userSites[siteNumber];

    for (let adNumber = 0; adNumber < site.ad.length; ++adNumber) {
      const ad = site.ad[adNumber];

      if (ad.status === 0) {
        try {
          await axios.post(
            `${HOST}ad_s/${userId}/${
              site.id
            }/add?access_token=${token}&connectionId=${connectionId}&ts=${ts}`,
            qs.stringify({
              adId: ad.id,
              connectionId,
              ts
            }),
            { headers }
          );
        } catch (e) {
          logger.error(
            `Ошибка включения рекламы ${ad.id} на сайте ${site.id}`,
            (e && e.response && e.response.data) || e
          );
        }

        logger.info(`Включена реклама ${ad.id} на сайте ${site.id}`);
      }
    }
  }
};
