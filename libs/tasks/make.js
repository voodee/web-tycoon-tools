const axios = require("axios");
const qs = require("qs");

const HOST = "https://game.web-tycoon.com/api/";
const MAX_IMPORTUNITY = 120;

const getHostingAllow = async (browser, userId, siteId) => {
  const page = await browser.newPage();
  await page.goto(
    `https://game.web-tycoon.com/players/${userId}/sites/${siteId}`,
    {
      waitUntil: "networkidle2"
    }
  );
  await page.waitForSelector(".hostingLimit");
  let { hostingLimitSource, trafSpeedSource } = await page.evaluate(() => {
    return {
      hostingLimitSource: document.getElementsByClassName("hostingLimit")[0]
        .textContent,
      trafSpeedSource: document.getElementsByClassName("trafSpeed")[0]
        .textContent
    };
  });
  await page.close();
  let hostingLimit = parseFloat(hostingLimitSource.replace(",", "."));
  if (hostingLimitSource.includes("тыс")) {
    hostingLimit *= 1000;
  }
  let trafSpeed = parseFloat(trafSpeedSource.replace(",", "."));
  if (trafSpeedSource.includes("тыс")) {
    trafSpeed *= 1000;
  }
  const diffTraf = trafSpeed / hostingLimit;

  return diffTraf < 0.95;
};

module.exports = async (browser, logger) => {
  logger.info(`Задача по таскам начата`);

  const page = await browser.newPage();
  await page.goto("https://game.web-tycoon.com/", {
    waitUntil: "networkidle2"
  });

  const token = await page.evaluate(() => localStorage.token);
  const userId = await page.evaluate(() => localStorage.userId);
  await page.close();

  // получаем сайты пользователя
  const {
    data: { sites, tasks, workers }
  } = await axios.get(`${HOST}users/${userId}/init?access_token=${token}`);
  const userSites = sites.reverse();
  for (let siteNumber = 0; siteNumber < userSites.length; ++siteNumber) {
    const site = userSites[siteNumber];
    logger.info(`Смотрим таски с сайта ${site.domain}`);

    let hostingAllow = false;
    try {
      hostingAllow = await getHostingAllow(browser, userId, site.id);
    } catch (e) {
      logger.error(
        `Не удалось узнать лимиты хостинга для сайта ${site.domain}`
      );
    }

    const taskTypes = ["backend", "frontend", "design", "marketing"];
    for (let taskNumber = 0; taskNumber < taskTypes.length; ++taskNumber) {
      const taskName = taskTypes[taskNumber];
      logger.info(`Смотрим таск ${taskName} с сайта ${site.domain}`);

      if (
        site.limit[taskName] === site.progress[taskName] &&
        taskName !== "marketing"
      ) {
        // если таск полностью заполнен
        for (let taskNum = 0; taskNum < tasks.length; ++taskNum) {
          const task = tasks[taskNum];

          // если на таске стоит исполнитель
          if (taskName === task.zone && task.siteId === site.id) {
            // снимаем его
            try {
              await axios.delete(
                `${HOST}sites/${userId}/${site.id}/${
                  task.workers[0]
                }?access_token=${token}`
              );
              logger.info(
                `Сняли работника ${task.workers[0]} с сайта ${site.domain}`
              );
            } catch (e) {
              logger.info(
                `Ошибка снятия работника с задачи`,
                e && e.response && e.response.data
              );
            }
          }
        }
      } else if (
        (taskName !== "marketing" &&
          hostingAllow &&
          !site.buffs.find(({ name }) => name === "ddos")) ||
        (taskName === "marketing" &&
          // количество опубликованного контента меньше 4
          site.content.filter(({ status }) => status === 1).length < 4)
      ) {
        // если таск не заполнен и лимит хостинга позволяет
        // ищем свободного работника
        const worker = workers.find(worker => {
          const taskData = {
            [worker.design]: "design",
            [worker.frontend]: "frontend",
            [worker.backend]: "backend",
            [worker.marketing]: "marketing"
          };
          const taskMain = taskData[Math.max(...Object.keys(taskData))];
          return (
            worker.status === 1 &&
            taskMain === taskName &&
            worker.energyValue > 5
          );
        });
        // если работник найден
        if (worker) {
          // то ставим его на задачу
          try {
            await axios.post(
              `${HOST}sites/${userId}/${site.id}/${taskNumber +
                1}/addTask?access_token=${token}`,
              qs.stringify({
                workerIds: [worker.id]
              })
            );
            worker.status = 2;
            logger.info(
              `Поставили работника ${worker.id} на сайт ${site.domain}`
            );
          } catch (e) {
            console.log(worker);
            console.log(
              "url",
              `${HOST}sites/${userId}/${site.id}/${taskNumber +
                1}/addTask?access_token=${token}`
            );
            logger.info(
              `Ошибка поставноки работника на задачу`,
              e && e.response && e.response.data
            );
          }
        }
      }
    }

    // если все таски закрыты
    if (
      taskTypes.every(
        taskName =>
          site.limit[taskName] === site.progress[taskName] ||
          taskName === "marketing"
      )
    ) {
      try {
        await axios.post(
          `${HOST}sites/${userId}/${site.id}/levelUp?access_token=${token}`
        );
        logger.info(`Сайт ${site.domain} опубликован`);
      } catch (e) {
        logger.info(
          `Ошибка публикации сайта`,
          e && e.response && e.response.data
        );
      }
    }
  }

  logger.info(`Задача по таскам закончена`);
};
