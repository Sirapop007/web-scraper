import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { franc } from "franc";
import LanguageDetect from "languagedetect";

puppeteer.use(StealthPlugin());
const prisma = new PrismaClient();

const checkLng = async (quote) => {
  if (quote) {
    const lngDetector = new LanguageDetect();
    const lng = lngDetector.detect(quote, 1);
    if (lng.length) return lng[0][0];
  }
  return null;
};

async function getBotton(page) {
  const buttonSelector =
    "#seoReviewsSection > div.MvR7 > div.Qu3l > div.Qu3l-buttons-wrapper > div > button > div.Iqt3-button-container > div > span";
  await page.click(buttonSelector);
  try {
    while (true) {
      await page;
      await page.waitForSelector(buttonSelector);
      await page.click(buttonSelector);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  } catch (error) {}
}

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

    await getBotton(page);

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

      const datesElement = await box.$(".c2oma-user-info");
      const date = datesElement
        ? await page.evaluate((el) => el.innerText, datesElement)
        : null;

      let formattedDate = null;

      if (date) {
        const [, monthYearPart] = date.split(", ");

        const today = new Date();
        const [monthName, yearString] = monthYearPart.split(" ");
        const year = parseInt(yearString, 10);

        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const month = monthNames.indexOf(monthName) + 1;

        const day = String(today.getDate()).padStart(2, "0");

        formattedDate = `${year}-${String(month).padStart(2, "0")}-${day}`;
      }

      let lg = null;
      if (reviews === "N/A") {
        lg = null;
      } else {
        const lng = franc(reviews, { only: ["tha"] });
        if (lng === "tha") {
          lg = "Thai";
        } else {
          lg = await checkLng(reviews);
        }
      }

      let rt = parseInt(ratings.split(".")[0]) / 2;
      let review_set = {
        store_name: infoName,
        review_on: formattedDate,
        comment: reviews,
        rating: rt,
        language: lg,
      };
      comments.push(review_set);

      const exist = await prisma.review.findFirst({
        where: {
          detail: reviews,
        },
      });
      if (!exist) {
        await prisma.review.create({
          data: {
            organization_id: new ObjectId("65c5a9760b5fff3be7a3afd3"),
            storename: infoName,
            topic: "",
            detail: reviews,
            rating: rt,
            review_on: formattedDate,
            language: lg,
            reference: "HotelsCombined",
          },
        });
      }
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
