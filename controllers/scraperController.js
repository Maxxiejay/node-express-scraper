const scraperService = require('../services/scraperServices');
const { logger } = require('../utils/logger');

class ScraperController {
  async scrapeUrl(req, res, next) {
    try {
      const { url, options = {} } = req.body;
      
      logger.info(`Scraping URL: ${url}`);
      const result = await scraperService.scrapeWebsite(url, options);
      
      res.json({
        success: true,
        data: result,
        scrapedAt: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async scrapeJavaScript(req, res, next) {
    try {
      const { url, options = {} } = req.body;
      
      logger.info(`Scraping JavaScript site: ${url}`);
      const result = await puppeteerService.scrapeJavaScriptSite(url, options);
      
      res.json({
        success: true,
        data: result,
        scrapedAt: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async scrapeSPA(req, res, next) {
    try {
      const { url, options = {} } = req.body;
      
      logger.info(`Scraping SPA: ${url}`);
      const result = await puppeteerService.scrapeSPA(url, options);
      
      res.json({
        success: true,
        data: result,
        scrapedAt: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async scrapeJavaScriptSelective(req, res, next) {
    try {
      const { url, selectors, options = {} } = req.body;
      
      if (!selectors || typeof selectors !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Selectors object is required'
        });
      }

      logger.info(`Selective JavaScript scraping URL: ${url}`);
      const result = await puppeteerService.scrapeSelectiveJS(url, selectors, options);
      
      res.json({
        success: true,
        data: result,
        scrapedAt: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async takeScreenshot(req, res, next) {
    try {
      const { url, options = {} } = req.body;
      
      logger.info(`Taking screenshot of: ${url}`);
      const screenshot = await puppeteerService.takeScreenshot(url, options);
      
      res.json({
        success: true,
        data: {
          url,
          screenshot,
          format: 'base64'
        },
        scrapedAt: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async scrapeBatch(req, res, next) {
    try {
      const { urls, options = {} } = req.body;
      
      if (!Array.isArray(urls)) {
        return res.status(400).json({
          success: false,
          error: 'URLs must be provided as an array'
        });
      }

      logger.info(`Batch scraping ${urls.length} URLs`);
      const results = await scraperService.scrapeBatch(urls, options);
      
      res.json({
        success: true,
        data: results,
        scrapedAt: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async scrapeSelective(req, res, next) {
    try {
      const { url, selectors, options = {} } = req.body;
      
      if (!selectors || typeof selectors !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Selectors object is required'
        });
      }

      logger.info(`Selective scraping URL: ${url}`);
      const result = await scraperService.scrapeSelective(url, selectors, options);
      
      res.json({
        success: true,
        data: result,
        scrapedAt: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async scrapeLinks(req, res, next) {
    try {
      const { url, options = {} } = req.body;
      
      logger.info(`Scraping links from URL: ${url}`);
      const links = await scraperService.extractLinks(url, options);
      
      res.json({
        success: true,
        data: { links },
        scrapedAt: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async scrapeImages(req, res, next) {
    try {
      const { url, options = {} } = req.body;
      
      logger.info(`Scraping images from URL: ${url}`);
      const images = await scraperService.extractImages(url, options);
      
      res.json({
        success: true,
        data: { images },
        scrapedAt: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ScraperController();