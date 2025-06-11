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
            // 기본 정보 수집
            const title = await implementor.scrapTitle(page, titleId);
            const uniqueId = await implementor.scrapUniqueId(page);
            const description = await implementor.scrapDescription(page);
            const thumbnailUrl = await implementor.scrapThumbnailUrl(page);
            
            // 메타 정보 수집
            const dayOfWeek = await implementor.scrapDayOfWeek(page);
            const status = await implementor.scrapStatus(page);
            const ageRating = await implementor.scrapAgeRating(page);
            const episodeCount = await implementor.scrapEpisodeCount(page);
            
            // 장르 및 작가 정보 수집
            const genres = await implementor.scrapGenres(page);
            const authors = await implementor.scrapAuthors(page);
            
            // 날짜 정보 수집
            const publishStartDate = await implementor.scrapPublishStartDate(page);
            const lastUpdatedDate = await implementor.scrapLastUpdatedDate(page);

            return {
                statusCode: 200,
                data: { 
                    title,
                    uniqueId,
                    platform,
                    description,
                    thumbnailUrl,
                    dayOfWeek,
                    status,
                    ageRating,
                    episodeCount,
                    genres,
                    authors,
                    publishStartDate,
                    lastUpdatedDate
                }
            };
        } finally {
            await page.close();
        }
    }
} 