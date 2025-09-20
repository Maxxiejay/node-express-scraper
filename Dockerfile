# Node.js Dockerfile for web-scraper
FROM node:20-alpine

# Install necessary dependencies for Puppeteer/Chromium
RUN apk add --no-cache \
	chromium \
	nss \
	freetype \
	harfbuzz \
	ca-certificates \
	ttf-freefont

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source code
COPY . .

# Puppeteer expects to find Chromium at this path
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Expose port (change if your app uses a different port)
EXPOSE 3000

# Start the app
CMD ["node", "app.js"]
