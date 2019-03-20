const axios = require("axios");

module.exports = async (browser, logger, { token, userId }) => {
  // получаем сайты пользователя
  const {
    data: { sites: userSites }
  } = await axios.get(
    `https://game.web-tycoon.com/api/users/${userId}/init?access_token=${token}`
  );

  for (let i = 0; i < userSites.length; ++i) {
    const site = userSites[i];
    try {
      const { data } = await axios.delete(
        `https://game.web-tycoon.com/api/links/${userId}/${
          site.id
        }/spam?access_token=${token}`
      );
      logger.log(`Почищены ссылки на сайте ${site.id}`);
    } catch (e) {
      logger.log(
        `Ошибка чистки ссылок на сайте ${site.id} - ${e.response.data}`
      );
    }
    await new Promise(res => setTimeout(res, 1 * 1000));
  }
};
