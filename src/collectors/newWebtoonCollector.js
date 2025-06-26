import { ContentCollector } from './contentCollector.js';
import { ScraperFactory } from '../scrapers/scraperFactory.js';

/**
 * 신작 웹툰을 탐색하고 정보를 수집하는 Collector
 */
export class NewWebtoonCollector extends ContentCollector {
    /**
     * 신작 웹툰을 탐색하고 정보를 수집한다.
     * @param {import('puppeteer-core').Browser} browser - Puppeteer 브라우저 인스턴스
     * @param {Object} data - 추가 데이터(필요시)
     * @returns {Promise<import('../types/webtoon.js').NewWebtoonInfo[]>} 신작 웹툰 리스트
     */
    async execute(browser, data) {
        const factory = new ScraperFactory();
        const scrapers = factory.getAllScrapers();
        /** @type {import('../types/webtoon.js').NewWebtoonInfo[]} */
        let allNewWebtoons = [];
        for (const scraper of scrapers) {
            const newWebtoonList = await scraper.scrapNewWebtoonList(browser);
            allNewWebtoons = allNewWebtoons.concat(newWebtoonList);
            console.log(newWebtoonList);
        }
        // 이제 해당 리스트에 웹툰 정보를 찾고 반환한다. 
        return allNewWebtoons;
    }
}