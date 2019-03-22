const axios = require("axios");
const qs = require("qs");

const HOST = "https://game.web-tycoon.com/api/";
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

const getPageData = async (browser, userId, siteId) => {
  const page = await browser.newPage();
  let result = null;
  try {
    await page.goto(
      `https://game.web-tycoon.com/players/${userId}/sites/${siteId}`,
      {
        waitUntil: "networkidle2"
      }
    );
    await page.waitForSelector(".hostingLimit");
    await new Promise(res => setTimeout(res, 200));
    result = await page.evaluate(() => {
      return {
        hostingLimitSource: document.getElementsByClassName("hostingLimit")[0]
          .textContent,
        trafSpeedSource: document.getElementsByClassName("trafSpeed")[0]
          .textContent,
        comments: [
          ...document.querySelectorAll(
            ".commentsList .message.positive, .commentsList .message.neutral"
          )
        ]
          .reduce((acc, el) => acc + el.innerText, "")
          .toLowerCase(),
        isActiveContentSource: !!document.querySelectorAll(
          "#content-score-receiver .effectCard"
        ).length
      };
    });
  } catch (e) {}
  await page.close();
  return result;
};

module.exports = async (browser, logger, { token, userId }) => {
  logger.info(`Задача по таскам начата`);

  // получаем сайты пользователя
  const {
    data: { sites, tasks, workers }
  } = await axios.get(`${HOST}users/${userId}/init?access_token=${token}`);
  const userSites = sites; //.reverse();
  for (let siteNumber = 0; siteNumber < userSites.length; ++siteNumber) {
    const site = userSites[siteNumber];
    logger.info(`Смотрим таски с сайта ${site.domain}`);

    let hostingAllow = false;
    let desiredContentId = null;
    let desiredContentId2 = null;
    let isActiveContent = true;
    try {
      const {
        hostingLimitSource,
        trafSpeedSource,
        comments,
        isActiveContentSource
      } = await getPageData(browser, userId, site.id);

      let hostingLimit = parseFloat(hostingLimitSource.replace(",", "."));
      if (hostingLimitSource.includes("тыс")) {
        hostingLimit *= 1000;
      }
      let trafSpeed = parseFloat(trafSpeedSource.replace(",", "."));
      if (trafSpeedSource.includes("тыс")) {
        trafSpeed *= 1000;
      }
      const diffTraf = trafSpeed / hostingLimit;

      hostingAllow = diffTraf < 0.95;

      // есть ли активный контент
      isActiveContent = isActiveContentSource;

      // считаем, какой контент хочет пользователь
      const contentCost = Object.keys(contentTypes).reduce((acc, type) => {
        const countType = (comments.match(new RegExp(type, "g")) || []).length;
        acc.push([type, countType]);
        return acc;
      }, []);
      const contentCostKeySorted = contentCost
        .sort((a, b) => a[1] - b[1])
        .reverse();

      desiredContentId = contentTypes[contentCostKeySorted[0][0]];
      desiredContentId2 = contentTypes[contentCostKeySorted[1][0]];

      // comments
    } catch (e) {
      logger.error(
        `Не удалось узнать лимиты хостинга для сайта ${site.domain}`,
        e
      );
    }

    const taskTypes = ["backend", "frontend", "design", "marketing"];
    for (let taskNumber = 0; taskNumber < taskTypes.length; ++taskNumber) {
      const taskName = taskTypes[taskNumber];
      logger.info(`Смотрим таск ${taskName} с сайта ${site.domain}`);

      if (
        // если таск полностью заполнен
        (taskName !== "marketing" &&
          site.limit[taskName] === site.progress[taskName]) ||
        // или это маркетинг и заполнены 4 слота
        (taskName === "marketing" &&
          site.content.filter(({ status }) => status === 1).length === 4)
      ) {
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
              // const worker = workers.find(
              //   worker => worker.id === task.workers[0]
              // );
              // worker.status = 1;
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
        // публикуем
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

    const contents = site.content.filter(({ status }) => status === 1);
    if (
      // если нет активного контента
      !isActiveContent &&
      // и если есть не опубликованный контент
      contents.length > 0
    ) {
      // находим контент для публикации
      let content = contents.find(
        ({ contenttypeId }) => contenttypeId === desiredContentId
      );
      if (!content) {
        content = contents.find(
          ({ contenttypeId }) => contenttypeId === desiredContentId2
        );
      }

      if (!content && contents.length > 3) {
        content = contents[0];
      }

      if (content) {
        // публикуем
        try {
          await axios.post(
            `${HOST}content/${userId}/${site.id}/${
              content.id
            }?access_token=${token}`
          );
          logger.info("Контент опубликован");
        } catch (e) {
          logger.error(
            `Не удалось опубликовать контент`,
            e && e.response && e.response.data
          );
        }
      }
    }
  }

  logger.info(`Задача по таскам закончена`);
};
