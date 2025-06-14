import { ContentCollector } from './contentCollector.js';
import { NaverScrapingImplementor } from './platforms/naverScrapingImplementor.js';
import { FileUtils } from '../utils/fileUtils.js';

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
            // 페이지 로드
            await implementor.loadPage(page, titleId);
            
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
            
            // 최신 무료 회차 정보 수집
            const latestFreeEpisode = await implementor.scrapLatestFreeEpisode(page);

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

            // 날짜 정보 수집
            const [publishStartDate, lastUpdatedDate] = await Promise.all([
                implementor.scrapPublishStartDate(page),
                implementor.scrapLastUpdatedDate(page)
            ]);

            // HTML 추출
            //const html = await implementor.extractHtml(page);

            // HTML 파일 저장
            //const htmlFilePath = await FileUtils.saveHtmlFile(html, platform, titleId);

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
                    previewCount,
                    genres,
                    authors,
                    latestFreeEpisode,
                    publishStartDate,
                    lastUpdatedDate,
                    freeEpisodes,
                    paidEpisodes,
                    relatedNovels,
                    relatedWebtoonIds
                }
            };
        } finally {
            await page.close();
        }
    }
} 