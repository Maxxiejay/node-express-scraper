const express = require('express');
const router = express.Router();
const scraperController = require('../controllers/scraperController');
const { validateScrapeRequest } = require('../middleware/validation');

// Route to scrape a single URL
router.post('/scrape', validateScrapeRequest, scraperController.scrapeUrl);

// Route to scrape multiple URLs
router.post('/scrape-batch', scraperController.scrapeBatch);

// Route to get scraped data with specific selectors
router.post('/scrape-selective', scraperController.scrapeSelective);

// Route to scrape and extract links
router.post('/scrape-links', scraperController.scrapeLinks);

// Route to scrape images
router.post('/scrape-images', scraperController.scrapeImages);

// JavaScript/SPA scraping routes
router.post('/scrape-js', scraperController.scrapeJavaScript);
router.post('/scrape-spa', scraperController.scrapeSPA);
router.post('/scrape-js-selective', scraperController.scrapeJavaScriptSelective);
router.post('/screenshot', scraperController.takeScreenshot);

module.exports = router;