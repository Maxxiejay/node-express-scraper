const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require('puppeteer')
const { logger } = require("../utils/logger");
const { isValidUrl, normalizeUrl } = require("../utils/urlUtils");

class ScraperService {
  constructor() {
    this.defaultHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
    };
  }

  async scrapeWebsite(url, options = {}) {
    try {
      if (!isValidUrl(url)) {
        throw new Error("Invalid URL provided");
      }

      const normalizedUrl = normalizeUrl(url);
      const response = await this.fetchPage(normalizedUrl, options);
      const $ = cheerio.load(response.data);

      return {
        url: normalizedUrl,
        title: $("title").text().trim(),
        metaDescription: $('meta[name="description"]').attr("content") || "",
        headings: this.extractHeadings($),
        paragraphs: this.extractParagraphs($),
        lists: this.extractLists($),
        // links: this.extractLinksFromCheerio($, normalizedUrl),
        // images: this.extractImagesFromCheerio($, normalizedUrl)
      };
    } catch (error) {
      logger.error(`Error scraping ${url}: ${error.message}`);
      throw error;
    }
  }

  async scrapeBatch(urls, options = {}) {
    const results = [];
    const errors = [];

    for (const url of urls) {
      try {
        const result = await this.scrapeWebsite(url, options);
        results.push(result);
      } catch (error) {
        errors.push({
          url,
          error: error.message,
        });
      }
    }

    return {
      results,
      errors,
      totalProcessed: urls.length,
      successCount: results.length,
      errorCount: errors.length,
    };
  }

  async scrapeSelective(url, selectors, options = {}) {
    try {
      if (!isValidUrl(url)) {
        throw new Error("Invalid URL provided");
      }

      const normalizedUrl = normalizeUrl(url);
      const response = await this.fetchPage(normalizedUrl, options);
      const $ = cheerio.load(response.data);

      const result = { url: normalizedUrl };

      for (const [key, selector] of Object.entries(selectors)) {
        if (typeof selector === "string") {
          result[key] = $(selector).text().trim();
        } else if (selector.type === "text") {
          result[key] = $(selector.selector).text().trim();
        } else if (selector.type === "attr") {
          result[key] = $(selector.selector).attr(selector.attribute);
        } else if (selector.type === "html") {
          result[key] = $(selector.selector).html();
        } else if (selector.type === "array") {
          result[key] = [];
          $(selector.selector).each((i, elem) => {
            result[key].push($(elem).text().trim());
          });
        }
      }

      return result;
    } catch (error) {
      logger.error(`Error in selective scraping ${url}: ${error.message}`);
      throw error;
    }
  }

  async extractLinks(url, options = {}) {
    try {
      const normalizedUrl = normalizeUrl(url);
      const response = await this.fetchPage(normalizedUrl, options);
      const $ = cheerio.load(response.data);

      return this.extractLinksFromCheerio($, normalizedUrl);
    } catch (error) {
      logger.error(`Error extracting links from ${url}: ${error.message}`);
      throw error;
    }
  }

  async extractImages(url, options = {}) {
    try {
      const normalizedUrl = normalizeUrl(url);
      const response = await this.fetchPage(normalizedUrl, options);
      const $ = cheerio.load(response.data);

      return this.extractImagesFromCheerio($, normalizedUrl);
    } catch (error) {
      logger.error(`Error extracting images from ${url}: ${error.message}`);
      throw error;
    }
  }

  async fetchPage(url, options = {}) {
    const config = {
      method: "GET",
      url,
      headers: { ...this.defaultHeaders, ...options.headers },
      timeout: options.timeout || 10000,
      maxRedirects: options.maxRedirects || 5,
    };

    try {
      const response = await axios(config);

      // ✅ Detect Cloudflare block
      if (
        response.headers["cf-mitigated"] ||
        (typeof response.data === "string" &&
          response.data.includes("Just a moment..."))
      ) {
        console.warn("⚠️ Cloudflare challenge detected, retrying with Puppeteer...");
        return await this.fetchPageWithBrowser(url);
      }

      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.warn("⚠️ 403 Forbidden, retrying with Puppeteer...");
        return await this.fetchPageWithBrowser(url);
      }
      throw error;
    }
  }

  async fetchPageWithBrowser(url) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // important for Render
    });
    const page = await browser.newPage();

    // Use same headers for consistency
    await page.setExtraHTTPHeaders(this.defaultHeaders);

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    const html = await page.content();
    await browser.close();

    return html;
  }

  // async fetchPage(url, options = {}) {
  //   const config = {
  //     method: "GET",
  //     url,
  //     headers: { ...this.defaultHeaders, ...options.headers },
  //     timeout: options.timeout || 10000,
  //     maxRedirects: options.maxRedirects || 5,
  //   };

  //   return await axios(config);
  // }

  extractHeadings($) {
    const headings = [];
    $("h1, h2, h3, h4, h5, h6").each((i, elem) => {
      headings.push({
        level: elem.tagName,
        text: $(elem).text().trim(),
      });
    });
    return headings;
  }

  extractParagraphs($) {
    const paragraphs = [];
    $("p").each((i, elem) => {
      const text = $(elem).text().trim();
      if (text) {
        paragraphs.push(text);
      }
    });
    return paragraphs;
  }

  extractLists($) {
    const lists = [];

    // Extract ordered lists (ol)
    $("ol").each((i, elem) => {
      const items = [];
      $(elem)
        .find("li")
        .each((j, li) => {
          const text = $(li).text().trim();
          if (text) {
            items.push(text);
          }
        });

      if (items.length > 0) {
        lists.push({
          type: "ordered",
          items: items,
        });
      }
    });

    // Extract unordered lists (ul)
    $("ul").each((i, elem) => {
      const items = [];
      $(elem)
        .find("li")
        .each((j, li) => {
          const text = $(li).text().trim();
          if (text) {
            items.push(text);
          }
        });

      if (items.length > 0) {
        lists.push({
          type: "unordered",
          items: items,
        });
      }
    });

    return lists;
  }

  extractLinksFromCheerio($, baseUrl) {
    const links = [];
    $("a[href]").each((i, elem) => {
      const href = $(elem).attr("href");
      const text = $(elem).text().trim();

      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          links.push({
            url: absoluteUrl,
            text: text || "No text",
            isExternal: !absoluteUrl.startsWith(new URL(baseUrl).origin),
          });
        } catch (error) {
          // Skip invalid URLs
        }
      }
    });
    return links;
  }

  extractImagesFromCheerio($, baseUrl) {
    const images = [];
    $("img[src]").each((i, elem) => {
      const src = $(elem).attr("src");
      const alt = $(elem).attr("alt") || "";

      if (src) {
        try {
          const absoluteUrl = new URL(src, baseUrl).href;
          images.push({
            src: absoluteUrl,
            alt: alt,
            title: $(elem).attr("title") || "",
          });
        } catch (error) {
          // Skip invalid URLs
        }
      }
    });
    return images;
  }
}

module.exports = new ScraperService();
