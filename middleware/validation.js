const { isValidUrl } = require('../utils/urlUtils');

const validateScrapeRequest = (req, res, next) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL is required'
    });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid URL format'
    });
  }

  // Check for potentially dangerous URLs
  const forbiddenPatterns = [
    /localhost/i,
    /127\.0\.0\.1/,
    /0\.0\.0\.0/,
    /192\.168\./,
    /10\./,
    /172\.(1[6-9]|2[0-9]|3[0-1])\./
  ];

  if (forbiddenPatterns.some(pattern => pattern.test(url))) {
    return res.status(400).json({
      success: false,
      error: 'Cannot scrape local or private network URLs'
    });
  }

  next();
};

const validateBatchRequest = (req, res, next) => {
  const { urls } = req.body;

  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({
      success: false,
      error: 'URLs array is required'
    });
  }

  if (urls.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one URL is required'
    });
  }

  if (urls.length > 10) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 10 URLs allowed per batch request'
    });
  }

  // Validate each URL
  for (const url of urls) {
    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        error: `Invalid URL format: ${url}`
      });
    }
  }

  next();
};

module.exports = {
  validateScrapeRequest,
  validateBatchRequest
};