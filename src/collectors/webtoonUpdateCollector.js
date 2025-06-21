import { ContentCollector } from './contentCollector.js';
import { ScraperFactory } from '../scrapers/scraperFactory.js';

export class WebtoonUpdateCollector extends ContentCollector {
    constructor(scraperFactory) {
        super();
        this.scraperFactory = scraperFactory || WebtoonUpdateCollector.scraperFactoryInstance;
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
            
            // 병렬로 모든 정보 수집 (더 효율적인 병렬 처리)
            const [currentEpisodeCount, lastUpdatedDate] = await Promise.all([
                implementor.scrapEpisodeCount(page),
                implementor.scrapLastUpdatedDate(page)
            ]);

            if (currentEpisodeCount > episodeCount) {
                const newEpisodes = currentEpisodeCount - episodeCount;
                
                // 무료와 유료 에피소드를 병렬로 수집
                const [freeEpisodes, paidEpisodes] = await Promise.all([
                    implementor.scrapLatestFreeEpisodes(page, newEpisodes),
                    implementor.scrapLatestPaidEpisodes(page, newEpisodes)
                ]);
                
                // 무료와 유료 에피소드를 통합
                const episodes = [...freeEpisodes, ...paidEpisodes];
                
                return {
                    statusCode: 200,
                    data: {
                        id,
                        url,
                        platform,
                        episodes,
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
                        episodes: [],
                        message: 'No new episodes. Collection is on hold.'
                    }
                };
            }
        } finally {
            await page.close();
        }
    }
} 