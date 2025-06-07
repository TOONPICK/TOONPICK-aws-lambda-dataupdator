const chromium = require('chrome-aws-lambda');

const getBrowserConfig = () => ({
  args: [
    ...chromium.args,
    '--disable-gpu',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--single-process'
  ],
  defaultViewport: {
    width: 1920,
    height: 1080
  },
  executablePath: chromium.executablePath,
  headless: true,
  ignoreHTTPSErrors: true,
});

module.exports = {
  chromium,
  getBrowserConfig
}; 