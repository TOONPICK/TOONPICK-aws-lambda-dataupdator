import { ContentCollector } from './contentCollector.js';
import { ScraperFactory } from '../scrapers/scraperFactory.js';

export class WebtoonUpdateCollector extends ContentCollector {
    constructor() {
        super();
        this.scraperFactory = WebtoonUpdateCollector.scraperFactoryInstance;
    }
    static scraperFactoryInstance = new ScraperFactory();

    /**
     * @param {import('puppeteer-core').Browser} browser
     * @param {import('../types/webtoon.js').WebtoonData} data
     * @returns {Promise<{statusCode: number, data: import('../types/webtoon.js').WebtoonUpdateResult}>}
     */
    async execute(browser, data) {
        const { titleId, platform, prevEpisodeCount } = data;
        const implementor = this.scraperFactory.getScraper(platform);
        const page = await browser.newPage();
        try {
            // 페이지 로드
            await implementor.loadPage(page, titleId);
            const currentEpisodeCount = await implementor.scrapEpisodeCount(page);

            if (currentEpisodeCount > prevEpisodeCount) {
                const newEpisodes = currentEpisodeCount - prevEpisodeCount;
                const [latestFreeEpisodes, latestPreviewEpisodes, lastUpdatedDate] = await Promise.all([
                    implementor.scrapLatestFreeEpisodes(page, newEpisodes),
                    implementor.scrapLatestPreviewEpisodes(page, newEpisodes),
                    implementor.scrapLastUpdatedDate(page)
                ]);
                return {
                    statusCode: 200,
                    data: {
                        titleId,
                        platform,
                        latestFreeEpisodes,
                        latestPreviewEpisodes,
                        lastUpdatedDate
                    }
                };
            } else {
                return {
                    statusCode: 204,
                    data: {
                        titleId,
                        platform,
                        message: 'No new episodes. Collection is on hold.'
                    }
                };
            }
        } finally {
            await page.close();
        }
    }
} 