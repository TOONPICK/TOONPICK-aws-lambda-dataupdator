import { ScrapperStrategy } from './scrapperStrategy.js';

export class ScrapperA extends ScrapperStrategy {
    /**
     * @param {import('../platforms/platformScrapper.js').PlatformScrapper} platform
     */
    constructor(platform) {
        super();
        this.platform = platform;
    }

    async execute(browser, data) {
        const page = await browser.newPage();
        try {
            const title = await this.platform.scrapTitle(page, data.titleId);
            
            return {
                statusCode: 200,
                data: {
                    title,
                    platform: data.platform || 'NAVER'
                }
            };
        } finally {
            await page.close();
        }
    }
} 