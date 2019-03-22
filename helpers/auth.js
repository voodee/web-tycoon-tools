module.exports = async browser => {
  const config = {};
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  page.on("request", request => {
    const url = request.url();
    if (url.includes("init")) {
      const urlParsed = new URL(url);
      config.connectionId = urlParsed.searchParams.get("connectionId");
      config.ts = urlParsed.searchParams.get("ts");
      config.headers = request.headers();
    }
    request.continue();
  });

  await page.goto("https://game.web-tycoon.com/#login", {
    waitUntil: "networkidle2"
  });

  // Login
  await page.type("#userEmail", process.env.login);
  await page.type("#userPassword", process.env.password);
  await page.click(".enterButton");
  await page.waitForNavigation();

  config.token = await page.evaluate(() => localStorage.token);
  config.userId = await page.evaluate(() => localStorage.userId);

  await page.close();

  while (!config.connectionId) {
    await new Promise(res => setTimeout(res, 2 * 1000));
  }
  return config;
};
