const axios = require("axios");

module.exports = async (browser, logger) => {
  const page = await browser.newPage();
  await page.goto("https://game.web-tycoon.com/", {
    waitUntil: "networkidle2"
  });

  const token = await page.evaluate(() => localStorage.token);
  const userId = await page.evaluate(() => localStorage.userId);

  await page.close();

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
  }
};
