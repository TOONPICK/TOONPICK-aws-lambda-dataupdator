const { chromium, getBrowserConfig } = require('../config/browser');

class WebtoonCrawler {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('브라우저를 시작합니다...');
    this.browser = await chromium.puppeteer.launch(await getBrowserConfig());
    
    console.log('새 페이지를 생성합니다...');
    this.page = await this.browser.newPage();
  }

  async crawlWebtoonTitle(url) {
    try {
      console.log('웹툰 페이지로 이동합니다...');
      await this.page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 25000
      });

      console.log('페이지 HTML 구조를 확인합니다...');
      const html = await this.getPageStructure();

      console.log('제목을 추출합니다...');
      const title = await this.extractTitle();
      console.log('추출된 제목:', title);

      return {
        pageUrl: url,
        title,
        success: title === '나노마신',
        timestamp: new Date().toISOString(),
        debug: html
      };
    } catch (error) {
      throw error;
    }
  }

  async getPageStructure() {
    return await this.page.evaluate(() => ({
      title: document.title,
      h2Tags: Array.from(document.querySelectorAll('h2')).map(h2 => ({
        className: h2.className,
        text: h2.textContent,
        html: h2.outerHTML
      }))
    }));
  }

  async extractTitle() {
    return await this.page.evaluate(() => {
      const h2Elements = document.querySelectorAll('h2');
      for (const h2 of h2Elements) {
        if (h2.textContent.includes('나노마신')) {
          return h2.textContent;
        }
      }
      return null;
    });
  }

  async cleanup() {
    if (this.browser !== null) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

module.exports = WebtoonCrawler; 