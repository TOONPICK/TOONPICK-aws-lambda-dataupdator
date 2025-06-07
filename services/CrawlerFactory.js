const EventTypes = require('../src/constants/EventTypes');
const WebtoonTitleCrawler = require('./crawlers/WebtoonTitleCrawler');

class CrawlerFactory {
  static createCrawler(eventType) {
    switch (eventType) {
      case EventTypes.WEBTOON_TITLE:
        return new WebtoonTitleCrawler();
      // 추가 크롤러 타입은 여기에 추가
      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }
  }
}

module.exports = CrawlerFactory; 