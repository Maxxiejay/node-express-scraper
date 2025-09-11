const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

const normalizeUrl = (url) => {
  try {
    const urlObj = new URL(url);
    // Remove trailing slash if present
    if (urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    return urlObj.toString();
  } catch (error) {
    throw new Error('Invalid URL provided');
  }
};

const getDomainFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return null;
  }
};

const isExternalUrl = (url, baseUrl) => {
  try {
    const urlObj = new URL(url);
    const baseUrlObj = new URL(baseUrl);
    return urlObj.hostname !== baseUrlObj.hostname;
  } catch (error) {
    return true; // If we can't parse, assume external
  }
};

const buildAbsoluteUrl = (relativeUrl, baseUrl) => {
  try {
    return new URL(relativeUrl, baseUrl).toString();
  } catch (error) {
    return null;
  }
};

module.exports = {
  isValidUrl,
  normalizeUrl,
  getDomainFromUrl,
  isExternalUrl,
  buildAbsoluteUrl
};