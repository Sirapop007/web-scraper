import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";

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
    await page
      .waitForNavigation({ waitUntil: "networkidle0", timeout: 5000 })
      .catch(() => {});

    const infoName = await page.evaluate(() => {
      const storenameInfo = document.querySelector(
        "#root > div > div.c--AO-main.c--AO-new-nav-breakpoints > div.c9Uqq > div.kml-layout.edges-m.mobile-edges.c31EJ > div.kml-row > div.c9Uqq-right-content.kml-col-5-12-l.kml-col-6-12-m > div.c9Uqq-hotel-info > div.Te83 > div:nth-child(1) > h1"
      );
      return storenameInfo.textContent.trim();
    });

    await page.evaluate(async () => {
      let lastScrollTop = window.scrollY;
      while (true) {
        window.scrollBy(0, 500);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (window.scrollY === lastScrollTop) {
          break;
        }
        lastScrollTop = window.scrollY;
      }
    });

    await page
      .waitForNavigation({ waitUntil: "networkidle0", timeout: 5000 })
      .catch(() => {});

    const buttonSelector =
      "#seoReviewsSection > div.MvR7 > div.Qu3l > div.Qu3l-buttons-wrapper > div > button > div.Iqt3-button-container > div > span";
    await page.click(buttonSelector);
    try {
      while (true) {
        await page.waitForSelector(buttonSelector);
        await page.click(buttonSelector);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch (error) {}

    await page
      .waitForNavigation({ waitUntil: "networkidle0", timeout: 5000 })
      .catch(() => {});

    let comments = [];
    const allPage = await page.$$(
      "#seoReviewsSection > div.MvR7 > div.Qu3l > div.c2oma > div.c2oma-review-content"
    );
    for (const box of allPage) {
      const reviewsElement = await box.$(".c2oma-review-text");
      const reviews = reviewsElement
        ? await page.evaluate((el) => el.innerText, reviewsElement)
        : null;

      const ratingsElement = await box.$(".c2oma-rating");
      const ratings = ratingsElement
        ? await page.evaluate((el) => el.innerText, ratingsElement)
        : null;
      let rt = parseInt(ratings.split(".")[0]) / 2;
      let review_set = {
        store_name: infoName,
        comment: reviews,
        rating: rt,
        reference: "HotelsCombined",
      };
      comments.push(review_set);
    }
    console.log(comments);

    const jsonString = JSON.stringify(comments, null, 2);
    const path = "/Users/sirapop/AiiLAB_Junior/web-scraper/HotelsCombined.json";
    fs.writeFile(path, jsonString, (err) => {
      if (err) {
        console.log("error: ", err);
        return;
      }
      console.log(`data saved to ${path}`);
    });

    await browser.close();
  } catch (error) {
    console.log("error");
  }
};
openwebHotelCombined();
