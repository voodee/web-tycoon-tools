module.exports = async browser => {
  const page = await browser.newPage();
  await page.goto("https://game.web-tycoon.com/#login", {
    waitUntil: "networkidle2"
  });

  // Login
  await page.type("#userEmail", process.env.login);
  await page.type("#userPassword", process.env.password);
  await page.click(".enterButton");
  await page.waitForNavigation();

  await page.close();
};
