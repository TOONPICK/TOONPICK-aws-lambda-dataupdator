const CrawlerStrategy = require('./CrawlerStrategy');

class WebtoonTitleCrawler extends CrawlerStrategy {
  async crawl(page, data) {
    const url = data.url;
    
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 25000
    });

    const html = await this.getPageStructure(page);
    const title = await this.extractTitle(page);

    return {
      pageUrl: url,
      title,
      success: title === '나노마신',
      timestamp: new Date().toISOString(),
      debug: html
    };
  }

  async getPageStructure(page) {
    return await page.evaluate(() => ({
      title: document.title,
      h2Tags: Array.from(document.querySelectorAll('h2')).map(h2 => ({
        className: h2.className,
        text: h2.textContent,
        html: h2.outerHTML
      }))
    }));
  }

  async extractTitle(page) {
    return await page.evaluate(() => {
      const h2Elements = document.querySelectorAll('h2');
      for (const h2 of h2Elements) {
        if (h2.textContent.includes('나노마신')) {
          return h2.textContent;
        }
      }
      return null;
    });
  }
}

module.exports = WebtoonTitleCrawler; 