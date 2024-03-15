import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import { franc } from "franc";
import { ObjectId } from "bson";
import LanguageDetect from "languagedetect";
import path from "path";
import { Prisma, PrismaClient } from "@prisma/client";

puppeteer.use(StealthPlugin());

const prisma = new PrismaClient({});

const openwebInstgram = async () =>{
    try {
        const browser = await puppeteer.launch({
            headless: false,
            ignoreDefaultArgs: ["--disable-extensions"],
            executablePath: "/opt/homebrew/bin/chromium",
          });
          const page = await browser.newPage();
          await page.goto(
            "https://www.instagram.com/explore/tags/thenaka/",
            {
              waitUntil: "domcontentloaded",
            }
          );
          await page
            .waitForNavigation({ waitUntil: "networkidle0", timeout: 5000 })
            .catch(() => {});
    } catch (error) {
        console.log(error);
    }
}
openwebInstgram();