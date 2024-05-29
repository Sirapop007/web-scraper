import puppeteer from "puppeteer-extra";
import fs from "fs";
import dayjs from "dayjs";
import { PrismaClient } from "@prisma/client";
import { ObjectId } from "bson";

const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const prisma = new PrismaClient();

const checkDate = (dateStr) => {
  const date = new Date();
  let cnt = 0;
  if (!dateStr) return date.toISOString().slice(0, 10);

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

  return date.toISOString().slice(0, 10);
};

const Openweb = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      ignoreDefaultArgs: ["--disable-extensions"],
      executablePath: "/opt/homebrew/bin/chromium",
      timeout: 5000,
      // protocolTimeout: 70000,
    });

    const page = await browser.newPage();

    await page.goto(
      "https://www.google.com/search?hl=en&q=%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%81%E0%B8%A3%E0%B8%B8%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%9E%E0%B8%A0%E0%B8%B9%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%95+google+bussiness&sca_esv=9a62d5621dcf5b62&sxsrf=ADLYWIItd5CRGDBR63h1WKIkd_7PYERWcQ%3A1716955939320&ei=I6tWZuvpEpKfseMPsMKRwAk&ved=0ahUKEwirh-6m_7GGAxWST2wGHTBhBJgQ4dUDCBA&uact=5&oq=%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%81%E0%B8%A3%E0%B8%B8%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%9E%E0%B8%A0%E0%B8%B9%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%95+google+bussiness&gs_lp=Egxnd3Mtd2l6LXNlcnAiU-C5guC4o-C4h-C4nuC4ouC4suC4muC4suC4peC4geC4o-C4uOC4h-C5gOC4l-C4nuC4oOC4ueC5gOC4geC5h-C4lSBnb29nbGUgYnVzc2luZXNzMgkQIRigARgKGCoyBxAhGKABGAoyBxAhGKABGAoyBxAhGKABGApIzzFQtwRYvDBwAngBkAEAmAH_BKABuR2qAQwwLjEzLjEuMS4yLjG4AQPIAQD4AQGYAhSgAoUewgIKEAAYsAMY1gQYR8ICBBAjGCfCAgUQABiABMICBhAAGBYYHsICCBAAGIAEGKIEwgIFECEYoAHCAgQQIRgKmAMAiAYBkAYIkgcMMi4xMy4xLjEuMi4xoAevdg&sclient=gws-wiz-serp#lrd=0x3050319642447ddd:0x1912f364775aed3a,1,,,,",
      {
        waitUntil: "domcontentloaded",
      }
    );

    await sleep(10000);

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
    // Save data to a file
    // fs.writeFileSync("days.txt", Day.join("\n"), "utf-8");
    // console.log("Data saved to days.txt");
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
              rating: "",
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
      rv.storename = "Bangkok Hospital Phuket";
      rv.rating = parseInt(ratings[cnt].split(" ")[1]);
      rv.reference = "Google Business";
      rv.review_on = DayFormat[cnt];

      if (
        rv.comment ==
        "I had to get one of those scripts. Met at the entrance by the guest management team  so sweet. No wait. Triage nurse did a double take and then immediately gave me an appointment same day. Had to wait until 1:30 pm then re present. Guided …"
      ) {
        console.log("found 1970 early wrong", rv.review_on);
      }

      await prisma.review.create({
        data: {
          organization_id: new ObjectId("6646df6420051e55dfb1ef35"),
          storename: rv.storename,
          review_on: new Date(rv.review_on),
          topic: "",
          detail: rv.comment,
          rating: rv.rating,
          reference: rv.reference,
          metadata: {
            url: "https://www.google.com/search?hl=en&q=%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%81%E0%B8%A3%E0%B8%B8%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%9E%E0%B8%A0%E0%B8%B9%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%95+google+bussiness&sca_esv=9a62d5621dcf5b62&sxsrf=ADLYWIItd5CRGDBR63h1WKIkd_7PYERWcQ%3A1716955939320&ei=I6tWZuvpEpKfseMPsMKRwAk&ved=0ahUKEwirh-6m_7GGAxWST2wGHTBhBJgQ4dUDCBA&uact=5&oq=%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%9A%E0%B8%B2%E0%B8%A5%E0%B8%81%E0%B8%A3%E0%B8%B8%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%9E%E0%B8%A0%E0%B8%B9%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%95+google+bussiness&gs_lp=Egxnd3Mtd2l6LXNlcnAiU-C5guC4o-C4h-C4nuC4ouC4suC4muC4suC4peC4geC4o-C4uOC4h-C5gOC4l-C4nuC4oOC4ueC5gOC4geC5h-C4lSBnb29nbGUgYnVzc2luZXNzMgkQIRigARgKGCoyBxAhGKABGAoyBxAhGKABGAoyBxAhGKABGApIzzFQtwRYvDBwAngBkAEAmAH_BKABuR2qAQwwLjEzLjEuMS4yLjG4AQPIAQD4AQGYAhSgAoUewgIKEAAYsAMY1gQYR8ICBBAjGCfCAgUQABiABMICBhAAGBYYHsICCBAAGIAEGKIEwgIFECEYoAHCAgQQIRgKmAMAiAYBkAYIkgcMMi4xMy4xLjEuMi4xoAevdg&sclient=gws-wiz-serp#lrd=0x3050319642447ddd:0x1912f364775aed3a,1,,,,",
            html: "",
            reviewer: "",
          },
        },
      });
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

// prisma.review
//   .findMany({ where: { review_on: new Date("1970-01-01").toISOString() } })
//   .then((res) => console.log(res.length));

// prisma.review
//   .deleteMany({
//     where: { review_on: new Date("1970-01-01").toISOString() },
//   })
//   .then((res) => console.log("success fully"));
