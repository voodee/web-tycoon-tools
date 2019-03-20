const axios = require("axios");
const qs = require("qs");

const HOST = "https://game.web-tycoon.com/api/";
const MAX_IMPORTUNITY = 120;

module.exports = async (browser, logger, { token, userId }) => {
  logger.info(`Задача по рекламе начата`);

  // получаем сайты пользователя
  const {
    data: { sites: userSites }
  } = await axios.get(`${HOST}users/${userId}/init?access_token=${token}`);

  // удаляем не тематическую рекламу
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
          `${HOST}ad_s/${userId}/${ad.id}/delete?access_token=${token}`
        );
        site.ad.splice(adNumber, 1);

        logger.info(
          `Удалена не тематическая реклама ${ad.id} с сайта ${site.id}`
        );
      }
    }
  }

  // Включаем выключенную рекламу
  for (let siteNumber = 0; siteNumber < userSites.length; ++siteNumber) {
    const site = userSites[siteNumber];

    for (let adNumber = 0; adNumber < site.ad.length; ++adNumber) {
      const ad = site.ad[adNumber];

      if (ad.status === 0) {
        try {
          await axios.post(
            `${HOST}ad_s/${userId}/${site.id}/add?access_token=${token}`,
            qs.stringify({
              adId: ad.id
            })
          );
        } catch (e) {
          console.log(
            `Ошибка включения рекламы ${ad.id} на сайте ${site.id}`,
            e.response.data
          );
        }

        logger.info(`Включена реклама ${ad.id} на сайте ${site.id}`);
      }
    }
  }

  // удаляем рекламу с никой конверсией
  for (let siteNumber = 0; siteNumber < userSites.length; ++siteNumber) {
    const site = userSites[siteNumber];

    const page = await browser.newPage();

    try {
      await page.goto(
        `https://game.web-tycoon.com/players/${userId}/sites/${site.id}`,
        {
          waitUntil: "networkidle2"
        }
      );
      await page.addScriptTag({
        url: "https://code.jquery.com/jquery-3.3.1.min.js"
      });
      await new Promise(res => setTimeout(res, 2 * 1000));
      const ads = await page.evaluate(() => {
        return $(".cardStats")
          .map(function() {
            return parseFloat(
              $(this)
                .find(".statsWr:eq(2)")
                .text()
                .replace(",", ".")
            );
          })
          .toArray();
      });

      for (let adNumber = 0; adNumber < ads.length; ++adNumber) {
        const adConv = ads[adNumber];

        if (adConv < 1.5) {
          const ad = site.ad[adNumber];

          try {
            await axios.delete(
              `${HOST}ad_s/${userId}/${ad.id}/delete?access_token=${token}`
            );
            site.ad.splice(adNumber, 1);

            logger.info(
              `Удалена реклама с низкой конверсией ${ad.id} с сайта ${site.id}`
            );
          } catch (e) {
            logger.error(
              `Ошибка удаления рекламы на сайте ${site.id}`,
              e.response
            );
          }
        }
      }
    } catch (e) {
      logger.error("ошибка удаления рекламы с низкой конверсией");
    }

    await page.close();
  }

  // ищем новую рекламу
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

  logger.info(`Задача по рекламе закончена`);
};
