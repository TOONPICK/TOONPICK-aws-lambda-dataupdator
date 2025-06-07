import { BaseScrapper } from './baseScrapper.js';
import { NaverScrapper } from './platforms/naverScrapper.js';

export class WebtoonScrapper extends BaseScrapper {
    constructor() {
        super();
        this.platformScrappers = new Map([
            ['NAVER', new NaverScrapper()]
        ]);
    }

    /**
     * @param {import('puppeteer-core').Browser} browser
     * @param {import('../types/webtoon.js').WebtoonData} data
     * @returns {Promise<{statusCode: number, data: import('../types/webtoon.js').WebtoonScrapResult}>}
     */
    async execute(browser, data) {
        const { titleId, platform = 'NAVER' } = data;
        
        const platformScrapper = this.platformScrappers.get(platform);
        if (!platformScrapper) {
            throw new Error(`지원하지 않는 플랫폼입니다: ${platform}`);
        }

        const page = await browser.newPage();
        try {
            const title = await platformScrapper.scrapTitle(page, titleId);

            return {
                statusCode: 200,
                data: { 
                    title,
                    platform
                }
            };
        } finally {
            await page.close();
        }
    }
} 