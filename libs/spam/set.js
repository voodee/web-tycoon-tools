const { get, post } = require("axios");
const qs = require("qs");

const HOST = "https://game.web-tycoon.com/api/";

module.exports = async (
  browser,
  logger,
  { token, userId, connectionId, ts, headers }
) => {
  // получаем сайты пользователя
  const {
    data: { sites: userSites }
  } = await get(
    `${HOST}users/${userId}/init?access_token=${token}&connectionId=${connectionId}&ts=${ts}`,
    { headers }
  );
  // получаем темы сайтов пользователя
  const siteTemes = userSites.map(site => +site.sitethemeId);

  // получаем все сайты
  let sites = [];
  for (let epochId = 0; epochId <= 5; ++epochId) {
    for (let i = 1; i <= 11; ++i) {
      try {
        const {
          data: { leaderboard }
        } = await get(
          `${HOST}leaderboard/getTraffic/${userId}/${i}?epochId=${epochId}&access_token=${token}&connectionId=${connectionId}&ts=${ts}`,
          { headers }
        );
        sites = [...sites, ...leaderboard];
      } catch (e) {
        logger.error(`Ошибка получения сайтов - ${epochId} ${i}`);
      }
      await new Promise(res => setTimeout(res, 200));
    }
  }

  // фильтруем сайты только по интересующим нас
  sites = sites.filter(({ sitethemeId }) => siteTemes.includes(sitethemeId));
  // спам доступен только после 9 уровня
  sites = sites.filter(({ selfLevel }) => +selfLevel > 8);
  // случайно мешаем
  sites = sites.sort(() => Math.random() - 0.5);

  for (let i = 0; i < sites.length; ++i) {
    const site = sites[i];
    // ищем сайт, на который будем ставить ссылку
    const userSite = userSites.find(
      ({ sitethemeId }) => +sitethemeId === +site.sitethemeId
    );
    try {
      const { data } = await post(
        `${HOST}links/${userId}/${site.siteId}/${
          userSite.id
        }/2?access_token=${token}&connectionId=${connectionId}&ts=${ts}`,
        qs.stringify({
          access_token: token,
          connectionId,
          ts
        }),
        { headers }
      );
      logger.log("Поставлена спамная ссылка", data);
    } catch (e) {
      logger.error(
        "Ошибка при поставноке спамной ссылки",
        e.response.data.error
      );
    }
    await new Promise(res => setTimeout(res, 3 * 60 * 1000));
  }
  logger.info("Спам закончился");
};
