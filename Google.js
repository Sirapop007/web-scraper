import puppeteer from "puppeteer-extra";
import fs from "fs";
import dayjs from "dayjs";
import { PrismaClient } from "@prisma/client";

const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const prisma = new PrismaClient();

const checkDate = (dateStr) => {
  const date = new Date();
  let cnt = 0;
  if (!dateStr) return;

  const vals = dateStr.split(" ");

  cnt = vals[0] == "a" ? 1 : parseInt(Number(vals[0]));

  let res = null;

  if (vals[1] == "year" || vals[1] == "years") {
    res = dayjs(date).subtract(cnt, "year");
    return res.toISOString().slice(0, 10);
  }

  if (vals[1] == "month" || vals[1] == "months") {
    res = dayjs(date).subtract(cnt, "month");
    return res.toISOString().slice(0, 10);
  }

  if (vals[1] == "week" || vals[1] == "weeks") {
    res = dayjs(date).subtract(cnt, "week");
    return res.toISOString().slice(0, 10);
  }

  return null;
};

const Openweb = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      ignoreDefaultArgs: ["--disable-extensions"],
      executablePath: "/opt/homebrew/bin/chromium",
    });

    const page = await browser.newPage();
    await page.goto(
      "https://www.google.com/search?hl=en&q=google+seefah+central+world&oq=google+seefah+central+world&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIGCAEQLhhA0gEINjc2N2owajGoAgCwAgA&sourceid=chrome&ie=UTF-8#lrd=0x30e29f5abd9d8167:0xd2fdac1edb9e78a5,1,,,,",
      //"https://www.google.com/search?hl=en&q=seefah+%E0%B8%97%E0%B8%AD%E0%B8%87%E0%B8%AB%E0%B8%A5%E0%B9%88%E0%B8%AD&oq=seefah+%E0%B8%97%E0%B8%AD%E0%B8%87%E0%B8%AB%E0%B8%A5%E0%B9%88%E0%B8%AD&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIICAEQABgNGB7SAQkxMTMwNGowajSoAgCwAgA&sourceid=chrome&ie=UTF-8#lrd=0x30e29fa94ce7a4f1:0x44dc38acebc20c07,1,,,,",
      {
        waitUntil: "domcontentloaded",
      }
    );
    await sleep(4000);
    // await scrollModalDialog(page, ".review-dialog-list");
    await page.evaluate(async () => {
      const element = document.querySelector(".review-dialog-list");
      let lastScrollTop = element.scrollTop;
      while (true) {
        element.scrollBy(0, 1300);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (element.scrollTop === lastScrollTop) {
          break;
        }
        lastScrollTop = element.scrollTop;
      }
    });

    const TextTitle = await page.evaluate(() => {
      const textElement = document.querySelector(
        ".c9QyIf > .review-dialog-top > div > .Lhccdd > div:first-child"
      );
      return textElement.textContent.trim();
    });

    const rating = await page.evaluate(() => {
      const spanElements = document.querySelectorAll(".lTi8oc.z3HNkc");
      const labels = [];
      spanElements.forEach((spanElement) => {
        const rating = spanElement.getAttribute("aria-label");
        if (rating) {
          labels.push(rating);
        }
      });
      return labels;
    });

    const Day = await page.evaluate(() => {
      const Days = [];
      const spanElements = document.querySelectorAll(".dehysf.lTi8oc");
      spanElements.forEach((spanElement) => {
        console.log(spanElement.innerText);
        Days.push(spanElement.innerText);
      });
      console.log(Days);
      return Days;
    });
    // console.log(Day);

    const DayFormat = Day.map((item) => {
      return checkDate(item);
    });

    const reviewText = await page.evaluate(() => {
      const elements = document.querySelectorAll(
        ".Jtu6Td > span > .f5axBf > span"
      );
      const fullReview = document.querySelectorAll(
        ".Jtu6Td > span > .f5axBf > span  >.review-full-text > div:first-child"
      );
      if (!elements) return null;
      if (!fullReview) return null;

      let comments = [];
      let ParentText = "";

      if (fullReview) {
        for (let el of fullReview) {
          for (let node of el.childNodes) {
            ParentText += node.nodeValue;
          }
          ParentText = ParentText.replace(/null/g, " ");
          comments.push({ comment: ParentText });
          ParentText = "";
        }

        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          let ParentText = "";
          for (let node of el.childNodes) {
            ParentText += node.nodeValue || "";
          }
          ParentText = ParentText.trim()
            .replace(/null/g, "")
            .replace(/\n/g, "")
            .replace(/\s+/g, " ")
            .replace(/-/g, "");
          if (
            ParentText &&
            ParentText !== "…" &&
            ParentText !== "  " &&
            ParentText !== "." &&
            ParentText !== " - " &&
            ParentText.length > 0
          ) {
            comments.push({
              storename: "",
              review_on: "",
              topic: "",
              comment: ParentText,
              raing: "",
            });
          }
        }
      }
      return comments;
    });

    let cnt = 0;
    const storename = TextTitle;
    const ratings = rating;
    for (let rv of reviewText) {
      rv.storename = storename;
      rv.raing = parseInt(ratings[cnt].split(" ")[1]);
      rv.reference = "Google_business";
      rv.review_on = DayFormat[cnt];

      const existingRecord = await prisma.review.findFirst({
        where: {
          detail: rv.comment,
        },
      });

      if (!existingRecord) {
        await prisma.review.create({
          data: {
            organization_id: "65c5a9760b5fff3be7a3afd3",
            storename: rv.storename,
            review_on: new Date(rv.review_on),
            topic: "",
            detail: rv.comment,
            rating: rv.raing,
            reference: rv.reference,
          },
        });
      }

      cnt++;
    }
    cnt = 0;

    const jsonString = JSON.stringify(reviewText, null, 2);
    const path = "/Users/sirapop/AiiLAB_Junior/web-scraper/Google.json";
    fs.writeFile(path, jsonString, (err) => {
      if (err) {
        console.log("error: ", err);
        return;
      }
      console.log(`data saved to ${path}`);
    });

    await browser.close();
  } catch (error) {
    console.log(error);
  }
};

Openweb();
