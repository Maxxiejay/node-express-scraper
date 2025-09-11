# Express Web Scraper

A robust Node.js/Express web scraper API with comprehensive features for extracting data from websites.

## Features

- 🚀 **Fast & Reliable**: Built with Express.js and Axios for optimal performance
- 🔒 **Security First**: Rate limiting, CORS protection, and input validation
- 📊 **Multiple Scraping Modes**: Basic, selective, batch, links, and images
- 🛡️ **Error Handling**: Comprehensive error handling and logging
- 🏗️ **Clean Architecture**: Well-organized code structure with separation of concerns

## Project Structure

```
express-web-scraper/
├── src/
│   ├── controllers/
│   │   └── scraperController.js    # Request handling logic
│   ├── services/
│   │   └── scraperService.js       # Core scraping functionality
│   ├── routes/
│   │   └── scraperRoutes.js        # API route definitions
│   ├── middleware/
│   │   ├── errorHandler.js         # Global error handling
│   │   └── validation.js           # Request validation
│   ├── utils/
│   │   ├── logger.js              # Custom logging utility
│   │   └── urlUtils.js            # URL manipulation helpers
│   └── app.js                     # Main application file
├── package.json
├── .env
└── README.md
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd express-web-scraper
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
# Edit .env with your configurations
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```

### Basic Scraping
```
POST /api/scraper/scrape
Content-Type: application/json

{
  "url": "https://example.com",
  "options": {
    "timeout": 10000,
    "headers": {
      "User-Agent": "Custom Agent"
    }
  }
}
```

### Selective Scraping
```
POST /api/scraper/scrape-selective
Content-Type: application/json

{
  "url": "https://example.com",
  "selectors": {
    "title": "h1",
    "description": {
      "selector": "meta[name='description']",
      "type": "attr",
      "attribute": "content"
    },
    "links": {
      "selector": "a",
      "type": "array"
    }
  }
}
```

### Batch Scraping
```
POST /api/scraper/scrape-batch
Content-Type: application/json

{
  "urls": [
    "https://example1.com",
    "https://example2.com"
  ],
  "options": {}
}
```

### Extract Links
```
POST /api/scraper/scrape-links
Content-Type: application/json

{
  "url": "https://example.com"
}
```

### Extract Images
```
POST /api/scraper/scrape-images
Content-Type: application/json

{
  "url": "https://example.com"
}
```

### JavaScript/SPA Scraping
```
POST /api/scraper/scrape-js
Content-Type: application/json

{
  "url": "https://spa-example.com",
  "options": {
    "waitUntil": "networkidle0",
    "waitTime": 3000,
    "waitForSelector": ".content-loaded",
    "screenshot": true
  }
}
```

### SPA-Specific Scraping
```
POST /api/scraper/scrape-spa
Content-Type: application/json

{
  "url": "https://react-app.com",
  "options": {
    "spaWaitTime": 5000,
    "scrollToLoad": true,
    "waitForSelector": ".app-loaded"
  }
}
```

### JavaScript Selective Scraping
```
POST /api/scraper/scrape-js-selective
Content-Type: application/json

{
  "url": "https://vue-app.com",
  "selectors": {
    "title": "h1",
    "items": {
      "selector": ".item",
      "type": "array"
    }
  },
  "options": {
    "waitTime": 2000
  }
}
```

### Take Screenshot
```
POST /api/scraper/screenshot
Content-Type: application/json

{
  "url": "https://example.com",
  "options": {
    "width": 1920,
    "height": 1080,
    "fullPage": true,
    "waitTime": 2000
  }
}
```

## Response Format

All endpoints return responses in the following format:

```json
{
  "success": true,
  "data": {
    // Scraped data here
  },
  "scrapedAt": "2024-01-01T12:00:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Usage Examples

### Basic Website Scraping

```javascript
const response = await fetch('http://localhost:3000/api/scraper/scrape', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com'
  })
});

const data = await response.json();
console.log(data);
```

### Selective Data Extraction

```javascript
const response = await fetch('http://localhost:3000/api/scraper/scrape-selective', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://news.ycombinator.com',
    selectors: {
      title: '.hnname a',
      stories: {
        selector: '.athing .storylink',
        type: 'array'
      },
      points: {
        selector: '.score',
        type: 'array'
      }
    }
  })
});
```

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: URL validation and sanitization
- **CORS Protection**: Configurable cross-origin requests
- **Helmet Security**: Security headers protection
- **Private Network Protection**: Blocks scraping of local/private IPs

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `DEFAULT_TIMEOUT` | 10000 | Request timeout in ms |
| `MAX_REDIRECTS` | 5 | Maximum HTTP redirects |

## Error Handling

The scraper handles various types of errors:

- **Network Errors**: Connection timeouts, DNS failures
- **HTTP Errors**: 404, 500, etc.
- **Validation Errors**: Invalid URLs, missing parameters
- **Rate Limit Errors**: Too many requests

## Development

### Running in Development Mode

```bash
npm run dev
```

This starts the server with nodemon for automatic restarts on file changes.

### Testing

```bash
# Run tests (when implemented)
npm test
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request