import { ContentCollector } from './contentCollector.js';
import { NaverScrapingImplementor } from './platforms/naverScrapingImplementor.js';

export class WebtoonContentCollector extends ContentCollector {
    constructor() {
        super();
        this.implementors = new Map([
            ['NAVER', new NaverScrapingImplementor()]
        ]);
    }

    /**
     * @param {import('puppeteer-core').Browser} browser
     * @param {import('../types/webtoon.js').WebtoonData} data
     * @returns {Promise<{statusCode: number, data: import('../types/webtoon.js').WebtoonScrapResult}>}
     */
    async execute(browser, data) {
        const { titleId, platform = 'NAVER' } = data;
        
        const implementor = this.implementors.get(platform);
        if (!implementor) {
            throw new Error(`지원하지 않는 플랫폼입니다: ${platform}`);
        }

        const page = await browser.newPage();
        try {
            const title = await implementor.scrapTitle(page, titleId);

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