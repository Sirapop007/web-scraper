import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import { franc } from "franc";
import LanguageDetect from "languagedetect";
import { Prisma, PrismaClient } from "@prisma/client";
import { ObjectId } from "bson";

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();

const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

function formatDate(inputDateString) {
  const monthAbbreviations = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12,
  };

  const [day, monthAbbr, year] = inputDateString.split(" ");
  const month = monthAbbreviations[monthAbbr];
  const dateObject = new Date(year, month, day);

  const formattedDate = dateObject.toISOString().split("T")[0];

  return formattedDate;
}
const checkLng = async (quote) => {
  if (quote) {
    const lngDetector = new LanguageDetect();
    const lng = lngDetector.detect(quote, 1);
    if (lng.length) return lng[0][0];
  }
  return null;
};

const OpenwebExpedia = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      ignoreDefaultArgs: ["--disable-extensions"],
      executablePath: "/opt/homebrew/bin/chromium",
    });
    const page = await browser.newPage();
    await page.goto(
      "https://www.expedia.co.th/en/Phuket-Hotels-The-Naka-Phuket.h5475290.Hotel-Information?chkin=2024-02-16&chkout=2024-02-17&destType=MARKET&destination=%E0%B8%81%E0%B8%A1%E0%B8%A5%E0%B8%B2%2C%20%E0%B8%A0%E0%B8%B9%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%95%20%28%E0%B8%88%E0%B8%B1%E0%B8%87%E0%B8%AB%E0%B8%A7%E0%B8%B1%E0%B8%94%29%2C%20%E0%B9%84%E0%B8%97%E0%B8%A2&langid=2057&latLong=7.949757%2C98.284656&mctc=3&mdpcid=TH.META.SKYSCANNER.HOTEL-CORESEARCH&mdpdtl=HTL.5475290.39903176-64c6-437c-ba49-2956bf6b4bd0&pwa_ts=1707472129050&referrerUrl=aHR0cHM6Ly93d3cuZXhwZWRpYS5jby50aC9Ib3RlbC1TZWFyY2g%3D&regionId=6337834&rfrr=HSR&rm1=a2&searchId=4c73980e-3a3a-45ea-bbd0-33d93c5f8905&selected=5475290&selectedRatePlan=386308434&selectedRoomType=201837788&sort=RECOMMENDED&top_cur=THB&top_dp=27532&useRewards=false&userIntent=&x_pwa=1s",
      {
        waitUntil: "domcontentloaded",
      }
    );

    await sleep(4000);

    const TextTitle = await page.evaluate(() => {
      const textElement = document.querySelector(
        "#app-layer-base > div > main > div > div > section > div.constrain-width > div.uitk-layout-flex.uitk-layout-flex-flex-direction-row-reverse > div.uitk-layout-flex-item.uitk-layout-flex-item-flex-grow-1 > div > div:nth-child(3) > div:nth-child(1) > div > div > div:nth-child(1) > div > div.uitk-spacing.uitk-spacing-padding-small-blockend-four.uitk-spacing-padding-large-blockstart-three > div > h1"
      );
      return textElement.textContent.trim();
    });
    await page
      .waitForNavigation({ waitUntil: "networkidle0", timeout: 5000 })
      .catch(() => {});

    const buttonSelector =
      "#app-layer-base > div > main > div > div > section > div.constrain-width > div.uitk-layout-flex.uitk-layout-flex-flex-direction-row-reverse > div.uitk-layout-flex-item.uitk-layout-flex-item-flex-grow-1 > div > div:nth-child(3) > div:nth-child(1) > div > div > div:nth-child(1) > div > div:nth-child(2) > div:nth-child(2) > button";
    await page.click(buttonSelector);

    await page
      .waitForNavigation({ waitUntil: "networkidle0", timeout: 5000 })
      .catch(() => {});

    const buttonSelectorMore =
      "#app-layer-reviews > section > div.uitk-sheet-content.uitk-sheet-content-padded.uitk-sheet-content-extra-large > div > div.uitk-layout-grid.uitk-layout-grid-has-auto-columns.uitk-layout-grid-has-columns.uitk-layout-grid-has-columns-by-medium.uitk-layout-grid-has-columns-by-large.uitk-layout-grid-display-grid > div.uitk-layout-grid-item.uitk-spacing.uitk-spacing-margin-blockstart-six > section > div.uitk-spacing.uitk-type-center.uitk-spacing-margin-block-three > button";
    await page.click(buttonSelectorMore);

    try {
      while (true) {
        await page.waitForSelector(buttonSelectorMore);
        await page.click(buttonSelectorMore);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch (error) {}

    const allPage = await page.$$(
      "div.uitk-card.uitk-card-roundcorner-all.uitk-card-has-primary-theme > div.uitk-card-content-section.uitk-card-content-section-border-block-end.uitk-card-content-section-padded"
    );

    let comments = [];
    for (const box of allPage) {
      const reviewerElements = await box.$("h4");
      const reviewer = reviewerElements
        ? await page.evaluate((el) => el.innerText, reviewerElements)
        : null;

      const reviewsElement = await box.$(
        "div.uitk-expando-peek-inner.display-lines > .uitk-text.uitk-type-300.uitk-text-default-theme > span"
      );
      const reviews = reviewsElement
        ? await page.evaluate((el) => el.innerText, reviewsElement)
        : null;

      const ratingsElement = await box.$("h3 > span");
      const ratings = ratingsElement
        ? await page.evaluate((el) => el.innerText, ratingsElement)
        : null;

      const datesElement = await box.$(
        "div.uitk-text.uitk-type-300.uitk-text-default-theme > span"
      );
      const dates = datesElement
        ? await page.evaluate((el) => el.innerText, datesElement)
        : null;

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

        let rt = parseInt(ratings.split("/")[0]) / 2;
        let dt = formatDate(dates);
        let review_set = {
          store_name: TextTitle,
          comment: reviews,
          rating: rt,
          date: new Date(dt),
          language: lg,
          reviewer: reviewer,
        };

        comments.push(review_set);

        // const where = {
        //   organization_id: new ObjectId("65c5a9760b5fff3be7a3afd3"),
        //   storename: TextTitle,
        // };

        // //   //* ชื่อคนรีวิว
        // if (reviewer) {
        //   where.metadata = { reviewer: reviewer };
        // }

        // if (reviews) {
        //   where.detail = reviews;
        // }

        // if (ratings) {
        //   where.rating = ratings;
        // }

        // const exist = await prisma.review.findFirst({
        //   where: where,
        // });

        // if (!exist) {
        //   await prisma.review.create({
        //     data: {
        //       organization_id: new ObjectId("65c5a9760b5fff3be7a3afd3"), 
        //       storename: TextTitle,
        //       topic: "",
        //       detail: reviews,
        //       rating: rt,
        //       review_on: review_set.date,
        //       language: lg,
        //       reference: "Expedia",
        //       metadata: {
        //         url: "https://www.expedia.co.th/en/Phuket-Hotels-The-Naka-Phuket.h5475290.Hotel-Information?chkin=2024-02-16&chkout=2024-02-17&destType=MARKET&destination=%E0%B8%81%E0%B8%A1%E0%B8%A5%E0%B8%B2%2C%20%E0%B8%A0%E0%B8%B9%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%95%20%28%E0%B8%88%E0%B8%B1%E0%B8%87%E0%B8%AB%E0%B8%A7%E0%B8%B1%E0%B8%94%29%2C%20%E0%B9%84%E0%B8%97%E0%B8%A2&langid=2057&latLong=7.949757%2C98.284656&mctc=3&mdpcid=TH.META.SKYSCANNER.HOTEL-CORESEARCH&mdpdtl=HTL.5475290.39903176-64c6-437c-ba49-2956bf6b4bd0&pwa_ts=1707472129050&referrerUrl=aHR0cHM6Ly93d3cuZXhwZWRpYS5jby50aC9Ib3RlbC1TZWFyY2g%3D&regionId=6337834&rfrr=HSR&rm1=a2&searchId=4c73980e-3a3a-45ea-bbd0-33d93c5f8905&selected=5475290&selectedRatePlan=386308434&selectedRoomType=201837788&sort=RECOMMENDED&top_cur=THB&top_dp=27532&useRewards=false&userIntent=&x_pwa=1s",
        //         html: "",
        //         reviewer: "",
        //       },
        //     },
        //   });
        // }
      }
    }

    const jsonString = JSON.stringify(comments, null, 2);
    const path = "/Users/sirapop/AiiLAB_Junior/web-scraper/Expedia.json";
    fs.writeFile(path, jsonString, (err) => {
      if (err) {
        console.log("error: ", err);
        return;
      }
      console.log(`data saved to ${path}`);
    });
    await browser.close();
  } catch (error) {
    console.error("Error:", error);
  }
};

OpenwebExpedia();
