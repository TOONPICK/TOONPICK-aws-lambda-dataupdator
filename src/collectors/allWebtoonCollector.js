import { ScraperFactory } from '../scrapers/scraperFactory.js';
import { ContentCollector } from './contentCollector.js';

/**
 * 모든 웹툰 리스트를 수집하는 콜렉터
 * @extends ContentCollector
 */
export class AllWebtoonCollector extends ContentCollector {
    /**
     * @param {import('puppeteer-core').Browser} browser
     * @param {Object} data
     * @returns {Promise<Array<{id: string, title: string, url: string, platform: string}>}
     */
    async execute(browser, data) {
        const factory = new ScraperFactory();
        const scrapers = factory.getAllScrapers();
        let allWebtoons = [];
        for (const scraper of scrapers) {
            const webtoonList = await scraper.scrapAllWebtoonList(browser);
            allWebtoons = allWebtoons.concat(webtoonList);
        }
        return allWebtoons;
    }
} 