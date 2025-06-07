class CrawlerStrategy {
  async crawl(page, data) {
    throw new Error('crawl method must be implemented');
  }
}

module.exports = CrawlerStrategy; 