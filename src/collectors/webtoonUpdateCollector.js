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
        const { id, url, platform, episodeCount } = data;
        const implementor = this.scraperFactory.getScraper(platform);
        const page = await browser.newPage();
        try {
            // 페이지 로드 (url 직접 사용)
            await implementor.loadPage(page, url);
            const currentEpisodeCount = await implementor.scrapEpisodeCount(page);

            if (currentEpisodeCount > episodeCount) {
                const newEpisodes = currentEpisodeCount - episodeCount;
                const [latestFreeEpisodes, latestPreviewEpisodes, lastUpdatedDate] = await Promise.all([
                    implementor.scrapLatestFreeEpisodes(page, newEpisodes),
                    implementor.scrapLatestPreviewEpisodes(page, newEpisodes),
                    implementor.scrapLastUpdatedDate(page)
                ]);
                return {
                    statusCode: 200,
                    data: {
                        id,
                        url,
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
                        id,
                        url,
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