const isLambdaEnvironment = process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

let puppeteer;
let chromium;
if (isLambdaEnvironment) {
  chromium = require('chrome-aws-lambda');
  puppeteer = chromium.puppeteer;
} else {
  puppeteer = require('puppeteer');
}

class BrowserManager {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    const options = {
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };

    this.browser = await puppeteer.launch(options);
    this.page = await this.browser.newPage();
  }

  getPage() {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    return this.page;
  }

  async cleanup() {
    if (this.browser !== null) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

module.exports = BrowserManager; 