import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

const openwebHotelCombined = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      ignoreDefaultArgs: ["--disable-extensions"],
      executablePath: "/opt/homebrew/bin/chromium",
    });
    const page = await browser.newPage();
    await page.goto(
      "https://www.hotelscombined.com/Hotel/The_Naka_Phuket_SHA_Plus.htm",
      {
        waitUntil: "domcontentloaded",
      }
    );
  } catch (error) {}
};
openwebHotelCombined();
