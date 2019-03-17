module.exports = async () => {
  const TIMEOUT = 2000;
  const logs = [];

  const logger = {
    log: str => logs.push(str)
  };

  const getSkill = $el =>
    $el
      .attr("class")
      .replace("score-", "")
      .replace("score", "")
      .trim();

  const findWorker = async $el => {
    const skill = $el
      .attr("class")
      .replace("taskItem", "")
      .trim();
    if ($el.find(".addWorker").length === 0) {
      logger.log(`Исполнитель уже работает над ${skill}`);
      return;
    }

    $el.find(".addWorker").click();
    // ждём открытия окна
    await new Promise(res => setTimeout(res, TIMEOUT));

    // фильтруем, оставляем только по специальности
    const $cards = $(".popupPortal .cardContainer:not(.inactive)");
    const cardsFiltered = [];
    const cardCount = $cards.length;
    for (let cardNumber = 0; cardNumber < cardCount; ++cardNumber) {
      const $card = $cards.eq(cardNumber);

      const $scores = $card.find(".score");
      let skillMain = getSkill($scores.eq(0));
      let skillValue = +$scores.eq(0).text();

      $scores.each(function() {
        const $score = $(this);
        if (skillValue < +$score.text()) {
          skillMain = getSkill($score);
          skillValue = +$score.text();
        }
      });
      if (
        // если это нужный скилл
        skillMain === skill &&
        // если у него энергии больше 5%
        ($card.find(".extraEnergy").length > 0 ||
          $card.find(".energy").width() / $card.find(".energyBar").width() >
            0.05)
      ) {
        cardsFiltered.push($card);
      }
    }

    if (cardsFiltered.length) {
      logger.log(`нашли исполнитеоля на таск ${skill}`);
      cardsFiltered[0].click();
    } else {
      logger.log(`НЕ нашли исполнитеоля на таск ${skill}`);
      $(".popupPortal .modalClose").click();
    }
  };

  const go = async () => {
    // переходим на страницу с сайтами
    $(".linkSites .title").click();
    await new Promise(res => setTimeout(res, TIMEOUT));
    logger.log("перешли на страницу сайтов");
    // считаем кол-во времени
    const siteCount = $(".siteCard").length;
    for (let i = 0; i < siteCount; ++i) {
      // переходим на страницу с сайтами
      $(".linkSites .title").click();
      await new Promise(res => setTimeout(res, TIMEOUT));
      logger.log(`перешли на сайт ${i}`);
      // переходим на нужный сайт
      $(".siteCard")
        .eq(i)
        .click();
      await new Promise(res => setTimeout(res, TIMEOUT));

      // проходим по таскам
      const $tasks = $(".taskItem:not(.marketing)");
      const tasksCount = $tasks.length;
      for (let j = 0; j < tasksCount; ++j) {
        const $el = $tasks.eq(j);
        const skill = $el
          .attr("class")
          .replace("taskItem", "")
          .trim();
        logger.log(`чекаем таск ${skill}`);
        const widthProgressBar = $el.find(".progressBar").width();
        const widthVersionProgress = $el.find(".versionProgress").width();
        if (widthProgressBar === widthVersionProgress) {
          $el.find(".cancelTask").click();
        } else {
          await findWorker($el);
        }
        await new Promise(res => setTimeout(res, TIMEOUT));
      }

      // проверяем, нужна ли публикация
      const buttonUpload = $(".versionUpload:not(.buttonDisabled)");
      if (buttonUpload.length) {
        buttonUpload.click();
      }

      /**
       * Контент
       **/
      // если нет активного контента
      if ($("#content-score-receiver .effectCard").length === 0) {
        // но есть готовый контен, то публикуем его
        if ($(".contentTypesWr .item .cardContainer").length > 0) {
          $(".contentTypesWr .item .cardContainer")
            .first()
            .click();
        }
      }

      // если готового контента максимальное количество
      if ($(".contentTypesWr .item .cardContainer").length > 3) {
        // то снимаем исполнителя
        $(".taskItem.marketing")
          .find(".cancelTask")
          .click();
      } else {
        // иначе ищем исполнителя
        const $el = $(".taskItem.marketing");
        await findWorker($el);
      }
    }

    // переходим на страницу с работниками
    $(".linkWorkers .title").click();
    await new Promise(res => setTimeout(res, TIMEOUT));
    logger.log("перешли на страницу с работниками");

    await (async () => {
      const $cards = $(".cardContainer");
      const cardsFiltered = [];
      for (let cardNumber = 0; cardNumber < $cards.length; ++cardNumber) {
        const $card = $cards.eq(cardNumber);
        logger.log(`проверяем работника ${cardNumber}`);
        if (
          // если работник не работает
          $card.find(".workingStatus").length === 0 &&
          // и у него энергии меньше 5%
          $card.find(".energy").width() / $card.find(".energyBar").width() <
            0.05
        ) {
          logger.log(`открываем работника ${cardNumber}`);
          $card.click();
          await new Promise(res => setTimeout(res, TIMEOUT));

          $buttons = $(".infoBlock footer button");
          for (
            let buttonNumber = 0;
            buttonNumber < $buttons.length;
            ++buttonNumber
          ) {
            $button = $buttons.eq(buttonNumber);
            if (
              $button.text().trim() === "Отправить отдохнуть" ||
              $button.text().trim() === "Отдохнуть"
            ) {
              logger.log("отправляем работника отдохнуть");
              $button.click();
            }
          }
          await new Promise(res => setTimeout(res, TIMEOUT / 10));

          $(".linkWorkers .title").click();
          await new Promise(res => setTimeout(res, TIMEOUT));
        }
      }
    })();
  };

  const time = Date.now();
  try {
    await go();
  } catch (e) {
    return `${e}`;
  }
  logger.log(`Время выполнения: ${(Date.now() - time) / 1000}`);
  return logs;
};
