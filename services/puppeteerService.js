const puppeteer = require('puppeteer');
const { logger } = require('../utils/logger');
const { isValidUrl, normalizeUrl } = require('../utils/urlUtils');

class PuppeteerService {
  constructor() {
    this.browser = null;
    this.defaultOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    };

    this.defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none'
};
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch(this.defaultOptions);
      logger.info('Puppeteer browser initialized');
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Puppeteer browser closed');
    }
  }

  async scrapeJavaScriptSite(url, options = {}) {
    let page;
    try {
      if (!isValidUrl(url)) {
        throw new Error('Invalid URL provided');
      }

      const normalizedUrl = normalizeUrl(url);
      const browser = await this.initBrowser();
      page = await browser.newPage();

      // Set user agent
      await page.setUserAgent(options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      // Set viewport
      await page.setViewport({
        width: options.width || 1920,
        height: options.height || 1080
      });

      // Set timeout
      page.setDefaultTimeout(options.timeout || 30000);

      // Navigate to page
      await page.goto(normalizedUrl, {
        waitUntil: options.waitUntil || 'networkidle2',
        timeout: options.timeout || 30000
      });

      // Wait for specific selector if provided
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
      }

      // Wait for additional time if specified
      if (options.waitTime) {
        await page.waitForTimeout(options.waitTime);
      }

      // Extract content
      const content = await page.evaluate(() => {
        // Get title
        const title = document.title || '';

        // Get meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        const metaDescription = metaDesc ? metaDesc.getAttribute('content') : '';

        // Get headings
        const headings = [];
        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
          headings.push({
            level: heading.tagName.toLowerCase(),
            text: heading.textContent.trim()
          });
        });

        // Get paragraphs
        const paragraphs = [];
        document.querySelectorAll('p').forEach(p => {
          const text = p.textContent.trim();
          if (text) paragraphs.push(text);
        });

        // Get links
        const links = [];
        document.querySelectorAll('a[href]').forEach(link => {
          const href = link.getAttribute('href');
          const text = link.textContent.trim();
          if (href) {
            links.push({
              url: new URL(href, window.location.href).href,
              text: text || 'No text',
              isExternal: !href.startsWith(window.location.origin) && !href.startsWith('/')
            });
          }
        });

        // Get images
        const images = [];
        document.querySelectorAll('img[src]').forEach(img => {
          const src = img.getAttribute('src');
          if (src) {
            images.push({
              src: new URL(src, window.location.href).href,
              alt: img.getAttribute('alt') || '',
              title: img.getAttribute('title') || ''
            });
          }
        });

        return {
          title,
          metaDescription,
          headings,
          paragraphs,
          links,
          images,
          bodyText: document.body.textContent.trim()
        };
      });

      return {
        url: normalizedUrl,
        ...content,
        screenshot: options.screenshot ? await page.screenshot({ encoding: 'base64', fullPage: true }) : null
      };

    } catch (error) {
      logger.error(`Error scraping JavaScript site ${url}: ${error.message}`);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async scrapeSelectiveJS(url, selectors, options = {}) {
    let page;
    try {
      if (!isValidUrl(url)) {
        throw new Error('Invalid URL provided');
      }

      const normalizedUrl = normalizeUrl(url);
      const browser = await this.initBrowser();
      page = await browser.newPage();

      await page.setUserAgent(options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.setViewport({ width: options.width || 1920, height: options.height || 1080 });
      
      await page.goto(normalizedUrl, {
        waitUntil: options.waitUntil || 'networkidle2',
        timeout: options.timeout || 30000
      });

      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
      }

      if (options.waitTime) {
        await page.waitForTimeout(options.waitTime);
      }

      // Execute selectors
      const result = await page.evaluate((selectors) => {
        const data = {};
        
        for (const [key, selector] of Object.entries(selectors)) {
          try {
            if (typeof selector === 'string') {
              const element = document.querySelector(selector);
              data[key] = element ? element.textContent.trim() : null;
            } else if (selector.type === 'text') {
              const element = document.querySelector(selector.selector);
              data[key] = element ? element.textContent.trim() : null;
            } else if (selector.type === 'attr') {
              const element = document.querySelector(selector.selector);
              data[key] = element ? element.getAttribute(selector.attribute) : null;
            } else if (selector.type === 'html') {
              const element = document.querySelector(selector.selector);
              data[key] = element ? element.innerHTML : null;
            } else if (selector.type === 'array') {
              const elements = document.querySelectorAll(selector.selector);
              data[key] = Array.from(elements).map(el => el.textContent.trim());
            }
          } catch (err) {
            data[key] = null;
          }
        }
        
        return data;
      }, selectors);

      return {
        url: normalizedUrl,
        ...result
      };

    } catch (error) {
      logger.error(`Error in selective JS scraping ${url}: ${error.message}`);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async scrapeSPA(url, options = {}) {
    let page;
    try {
      if (!isValidUrl(url)) {
        throw new Error('Invalid URL provided');
      }

      const normalizedUrl = normalizeUrl(url);
      const browser = await this.initBrowser();
      page = await browser.newPage();

      // Enable JavaScript
      await page.setJavaScriptEnabled(true);
      await page.setUserAgent(options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.setViewport({ width: options.width || 1920, height: options.height || 1080 });

      // Go to page and wait for SPA to load
      await page.goto(normalizedUrl, { waitUntil: 'networkidle0', timeout: 30000 });

      // Wait for SPA content to render
      await page.waitForTimeout(options.spaWaitTime || 3000);

      // Wait for specific content if provided
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 15000 });
      }

      // Scroll to load lazy content if needed
      if (options.scrollToLoad) {
        await page.evaluate(() => {
          return new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if (totalHeight >= scrollHeight) {
                clearInterval(timer);
                resolve();
              }
            }, 100);
          });
        });
      }

      // Extract SPA content
      const content = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          content: document.body.innerText,
          links: Array.from(document.querySelectorAll('a[href]')).map(a => ({
            text: a.textContent.trim(),
            href: a.href
          })),
          buttons: Array.from(document.querySelectorAll('button')).map(btn => ({
            text: btn.textContent.trim(),
            type: btn.type || 'button'
          })),
          forms: Array.from(document.querySelectorAll('form')).map(form => ({
            action: form.action,
            method: form.method
          }))
        };
      });

      return content;

    } catch (error) {
      logger.error(`Error scraping SPA ${url}: ${error.message}`);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }


  async takeScreenshot(url, options = {}) {
    let page;
    try {
      const browser = await this.initBrowser();
      page = await browser.newPage();

      await page.setViewport({
        width: options.width || 1920,
        height: options.height || 1080
      });

      await page.goto(url, { waitUntil: 'networkidle2' });

      if (options.waitTime) {
        await page.waitForTimeout(options.waitTime);
      }

      const screenshot = await page.screenshot({
        fullPage: options.fullPage || true,
        encoding: 'base64'
      });

      return screenshot;
    } catch (error) {
      logger.error(`Error taking screenshot of ${url}: ${error.message}`);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
}

module.exports = new PuppeteerService();