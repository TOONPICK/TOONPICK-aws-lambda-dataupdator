import { NaverScraper } from './naverScraper.js';

export class ScrapperFactory {
    constructor() {
        this.scrappers = new Map([
            ['NAVER', new NaverScraper()]
        ]);
    }

    /**
     * 플랫폼에 맞는 ScrapingImplementor를 반환합니다.
     * @param {string} platform
     * @returns {import('./naverScraper.js').NaverScraper}
     */
    getScrapper(platform) {
        const key = platform ? platform.toUpperCase() : undefined;
        const scrapper = this.scrappers.get(key);
        if (!scrapper) {
            throw new Error(`지원하지 않는 플랫폼입니다: ${platform}`);
        }
        return scrapper;
    }

    /**
     * 새로운 Scrapper를 등록합니다.
     * @param {string} platform
     * @param {import('./naverScraper.js').NaverScraper} scrapper
     */
    registerScrapper(platform, scrapper) {
        const key = platform ? platform.toUpperCase() : undefined;
        this.scrappers.set(key, scrapper);
    }
} 