const MAX_IMPORTUNITY = 120;
const contentTypes = {
  аудио: 1,
  видео: 2,
  стрим: 3,
  фото: 4,
  стат: 5,
  обзор: 6,
  анонс: 7,
  опрос: 8
};

module.exports = async (
  browser,
  logger,
  { token, userId, connectionId, ts, headers }
) => {
  logger.info(`Задача по управлению задачами начата`);
  const page = await browser.newPage();

  await page.goto(`https://game.web-tycoon.com/players/${userId}/sites`, {
    waitUntil: "networkidle2"
  });
  await page.waitForSelector(".siteCard");

  try {
    let sites = await page.$$(".siteCard");
    for (let siteNumber = 0; siteNumber < 2; ++siteNumber) {
      await page.click(`.linkSites`);
      await page.waitForSelector(".siteCard");
      // :(
      await new Promise(res => setTimeout(res, 1 * 1000));
      let sites = await page.$$(".siteCard");
      logger.info(`Смотрим задачи на сайте ${siteNumber}`);
      // :(
      await new Promise(res => setTimeout(res, 1 * 1000));
      await sites[siteNumber].click();
      await page.waitForSelector(".aboutWr");
      await new Promise(res => setTimeout(res, 1 * 1000));

      const hostingLimitSource = await (await (await page.$(
        ".hostingLimit"
      )).getProperty("textContent")).jsonValue();
      let hostingLimit = parseFloat(hostingLimitSource.replace(",", "."));
      if (hostingLimitSource.includes("тыс")) {
        hostingLimit *= 1000;
      }

      const trafSpeedSource = await (await (await page.$(
        ".trafSpeed"
      )).getProperty("textContent")).jsonValue();
      let trafSpeed = parseFloat(trafSpeedSource.replace(",", "."));
      if (trafSpeedSource.includes("тыс")) {
        trafSpeed *= 1000;
      }

      const hostingAllow = trafSpeed / hostingLimit < 0.95;
      // есть ли активный контент
      const isActiveContent = !(await page.$$(
        "#content-score-receiver .effectCard"
      )).length;
      // комментарии
      const comments = await page.evaluate(() => {
        return [
          ...document.querySelectorAll(
            ".commentsList .message.positive, .commentsList .message.neutral"
          )
        ]
          .reduce((acc, el) => acc + el.innerText, "")
          .toLowerCase();
      });
      // считаем, какой контент хочет пользователь
      const contentCost = Object.keys(contentTypes).reduce((acc, type) => {
        const countType = (comments.match(new RegExp(type, "g")) || []).length;
        acc.push([type, countType]);
        return acc;
      }, []);
      const contentCostKeySorted = contentCost
        .sort((a, b) => a[1] - b[1])
        .reverse();

      const desiredContentId = contentTypes[contentCostKeySorted[0][0]];
      const desiredContentId2 = contentTypes[contentCostKeySorted[1][0]];

      console.log("trafSpeed", trafSpeed);
      console.log("hostingLimit", hostingLimit);
      console.log("desiredContentId", desiredContentId);
      console.log("desiredContentId2", desiredContentId2);
    }
  } catch (e) {
    logger.error(`Ошибка управления задачами`, e);
  }

  await page.close();
  logger.info(`Задача по управлению задачами закончена`);
};
