const axios = require("axios");
const qs = require("qs");

const HOST = "https://game.web-tycoon.com/api/";
const MAX_IMPORTUNITY = 120;

module.exports = async (browser, logger, { token, userId }) => {
  logger.info(`Задача по поиску рекламы начата`);

  // получаем сайты пользователя
  const {
    data: { sites: userSites }
  } = await axios.get(`${HOST}users/${userId}/init?access_token=${token}`);

  // ищем новую рекламу
  logger.info(`ищем новую рекламу`);

  const page = await browser.newPage();
  await page.goto(`https://game.web-tycoon.com/players/${userId}/sites`, {
    waitUntil: "networkidle2"
  });
  for (let siteNumber = 0; siteNumber < userSites.length; ++siteNumber) {
    const site = userSites[siteNumber];

    // вычисляем сумму назойливости
    const importunities = site.ad.map(ad => ad.importunity);
    const importunitiesSum = importunities.reduce(
      (accumulator, importunity) => accumulator + importunity,
      0
    );

    // если назойливость уже высокая, то ничего не делаем
    if (importunitiesSum > MAX_IMPORTUNITY) {
      continue;
    }
    // если достигли лимита, то ничего не делаем
    if (site.ad.length >= site.adSlots) {
      continue;
    }

    // если назойливость маленькая, то ищем мощную рекламу - "Поискать в интернете"
    if (importunitiesSum < 50) {
      try {
        await axios.post(
          `${HOST}ad_s/ad/${userId}/generateOffers/${
            site.id
          }/1?access_token=${token}`
        );
      } catch (e) {
        console.log(
          `Ошибка поиска рекламы на сайте ${site.id}`,
          e.response.data
        );
      }
      continue;

      logger.info(`Ищем мозную рекламу для сайта ${site.id}`);
    }

    // иначе ищем слабую рекламу
    // ToDo: узнать какой флаг означает, что поиск уже идёт
    try {
      await axios.post(
        `${HOST}ad_s/ad/${userId}/generateOffers/${
          site.id
        }/0?access_token=${token}`
      );
    } catch (e) {
      console.log(`Ошибка поиска рекламы на сайте ${site.id}`, e.response.data);
    }

    logger.info(`Ищем слабую рекламу для сайта ${site.id}`);
  }
  await page.close();

  logger.info(`Задача по поиску рекламы закончена`);
};
