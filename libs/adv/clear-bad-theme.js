const axios = require("axios");

const HOST = "https://game.web-tycoon.com/api/";
const MAX_IMPORTUNITY = 120;

module.exports = async (
  browser,
  logger,
  { token, userId, headers, initData, connectionId, ts }
) => {
  // удаляем не тематическую рекламу
  logger.info(`удаляем не тематическую рекламу`);

  // получаем сайты пользователя
  const {
    data: { sites: userSites }
  } = await axios.get(
    `${HOST}users/${userId}/init?access_token=${token}&connectionId=${connectionId}&ts=${ts}`,
    { headers }
  );

  for (let siteNumber = 0; siteNumber < userSites.length; ++siteNumber) {
    const site = userSites[siteNumber];

    // если категория общая, то оставляем всю рекламу
    if (site.sitethemeId === 19) {
      continue;
    }

    for (let adNumber = 0; adNumber < site.ad.length; ++adNumber) {
      const ad = site.ad[adNumber];

      if (ad.adthemeId !== site.sitethemeId) {
        await axios.delete(
          `${HOST}ad_s/${userId}/${
            ad.id
          }/delete?access_token=${token}&connectionId=${connectionId}&ts=${ts}`,
          { headers }
        );
        site.ad.splice(adNumber, 1);

        logger.info(
          `Удалена не тематическая реклама ${ad.id} с сайта ${site.id}`
        );
      }
    }
  }
};
