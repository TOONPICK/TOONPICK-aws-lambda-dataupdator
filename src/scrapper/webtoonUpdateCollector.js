import { ContentCollector } from './contentCollector.js';
import { NaverScrapingImplementor } from './platforms/naverScrapingImplementor.js';

export class WebtoonUpdateCollector extends ContentCollector {
    constructor() {
        super();
        this.implementors = new Map([
            ['NAVER', new NaverScrapingImplementor()]
        ]);
    }

    /**
     * @param {import('puppeteer-core').Browser} browser
     * @param {import('../types/webtoon.js').WebtoonData} data
     * @returns {Promise<{statusCode: number, data: import('../types/webtoon.js').WebtoonUpdateResult}>}
     */
    async execute(browser, data) {
        const { titleId, platform = 'NAVER' } = data;
        
        const implementor = this.implementors.get(platform);
        if (!implementor) {
            throw new Error(`지원하지 않는 플랫폼입니다: ${platform}`);
        }

        const page = await browser.newPage();
        try {
            // 페이지 로드
            await implementor.loadPage(page, titleId);
            
            // 업데이트 정보 수집
            const [latestFreeEpisode, paidEpisodes, lastUpdatedDate] = await Promise.all([
                implementor.scrapLatestFreeEpisode(page),
                implementor.scrapPaidEpisodes(page),
                implementor.scrapLastUpdatedDate(page)
            ]);

            return {
                statusCode: 200,
                data: {
                    titleId,
                    platform,
                    latestFreeEpisode,
                    paidEpisodes,
                    lastUpdatedDate
                }
            };
        } finally {
            await page.close();
        }
    }
} 