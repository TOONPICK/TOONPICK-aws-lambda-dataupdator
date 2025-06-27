import { ContentCollector } from './contentCollector.js';
import { ScraperFactory } from '../scrapers/scraperFactory.js';

export class WebtoonContentCollector extends ContentCollector {
    constructor(scraperFactory) {
        super();
        this.scraperFactory = scraperFactory || WebtoonContentCollector.scraperFactoryInstance;
    }
    static scraperFactoryInstance = new ScraperFactory();

    /**
     * @param {import('puppeteer-core').Browser} browser
     * @param {import('../types/webtoon.js').WebtoonData} data
     * @returns {Promise<import('../types/webtoon.js').WebtoonScrapResult>}
     */
    async execute(browser, data) {
        const { id, url, platform, episodeCount } = data;
        const implementor = this.scraperFactory.getScraper(platform);
        const page = await browser.newPage();
        const publishPage = await browser.newPage(); // 연재 시작일용 별도 페이지
        
        try {
            // 1. 연재 시작일 수집 (별도 페이지에서)
            let publishStartDate = null;
            try {
                await implementor.loadPage(publishPage, url);
                publishStartDate = await implementor.scrapPublishStartDate(publishPage);
            } catch (error) {
                console.warn('연재 시작일 수집 실패:', error.message);
            } finally {
                await publishPage.close();
            }
            
            // 2. 메인 페이지에서 모든 데이터 수집
            await implementor.loadPage(page, url);
            
            // 기본 정보 수집
            const [title, uniqueId, description, thumbnailUrl] = await Promise.all([
                implementor.scrapTitle(page),
                implementor.scrapUniqueId(page),
                implementor.scrapDescription(page),
                implementor.scrapThumbnailUrl(page)
            ]);
            
            // 메타 정보 수집
            const [dayOfWeek, status, ageRating, episodeCount, previewCount] = await Promise.all([
                implementor.scrapDayOfWeek(page),
                implementor.scrapStatus(page),
                implementor.scrapAgeRating(page),
                implementor.scrapEpisodeCount(page),
                implementor.scrapPreviewCount(page)
            ]);
            
            // 장르 및 작가 정보 수집
            const [genres, authors] = await Promise.all([
                implementor.scrapGenres(page),
                implementor.scrapAuthors(page)
            ]);
            
            // 모든 회차 정보 수집
            const [freeEpisodes, paidEpisodes] = await Promise.all([
                implementor.scrapFreeEpisodes(page),
                implementor.scrapPaidEpisodes(page)
            ]);

            // 관련 상품 정보 수집
            const [relatedNovels, relatedWebtoonIds] = await Promise.all([
                implementor.scrapRelatedNovels(page),
                implementor.scrapRelatedWebtoonIds(page)
            ]);

            // 마지막 업데이트 날짜 수집
            const lastUpdatedDate = await implementor.scrapLastUpdatedDate(page);

            const episodes = [...freeEpisodes, ...paidEpisodes];

            return {
                id: 0,
                externalId: id,
                url,
                title,
                uniqueId,
                platform,
                description,
                thumbnailUrl,
                dayOfWeek,
                status,
                ageRating,
                episodeCount,
                previewCount,
                genres,
                authors,
                publishStartDate,
                lastUpdatedDate,
                episodes,   
                relatedNovels,
                relatedWebtoonIds
            };
        } finally {
            await page.close();
        }
    }
} 