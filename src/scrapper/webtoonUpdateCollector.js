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
            
            // 최신 무료/유료(미리보기) 회차 3개씩만 수집
            const [latestFreeEpisodes, latestPreviewEpisodes, lastUpdatedDate] = await Promise.all([
                implementor.scrapLatestFreeEpisodes(page, 3),
                implementor.scrapLatestPreviewEpisodes(page, 3),
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
        } finally {
            await page.close();
        }
    }
} 