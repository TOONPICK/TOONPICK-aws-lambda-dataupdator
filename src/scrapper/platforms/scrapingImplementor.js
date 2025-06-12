/**
 * 스크래핑 구현체 인터페이스
 * 브릿지 패턴의 Implementor 역할
 * @interface
 */
export class ScrapingImplementor {
    /**
     * 웹툰 페이지를 로드하고 필요한 요소들이 로드될 때까지 대기합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @param {string} titleId - 웹툰의 고유 ID
     * @returns {Promise<void>}
     */
    async loadPage(page, titleId) {
        throw new Error('loadPage 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰 제목을 스크래핑합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 웹툰 제목
     */
    async scrapTitle(page) {
        throw new Error('scrapTitle 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰의 연재 요일을 스크래핑합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string|null>} 연재 요일 (월~일)
     */
    async scrapDayOfWeek(page) {
        throw new Error('scrapDayOfWeek 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰의 연재 상태를 스크래핑합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 연재 상태 (ONGOING, COMPLETED, HIATUS)
     */
    async scrapStatus(page) {
        throw new Error('scrapStatus 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰의 연령 등급을 스크래핑합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string|null>} 연령 등급 (ALL, AGE_12, AGE_15, ADULT)
     */
    async scrapAgeRating(page) {
        throw new Error('scrapAgeRating 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰의 장르 목록을 스크래핑합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string[]>} 장르 목록
     */
    async scrapGenres(page) {
        throw new Error('scrapGenres 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰의 에피소드 수를 스크래핑합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<number|null>} 에피소드 수
     */
    async scrapEpisodeCount(page) {
        throw new Error('scrapEpisodeCount 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰의 줄거리를 스크래핑합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 웹툰 줄거리
     */
    async scrapDescription(page) {
        throw new Error('scrapDescription 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰의 작가 정보를 스크래핑합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<Array<{id: string, name: string, role: string}>>} 작가 정보 목록
     */
    async scrapAuthors(page) {
        throw new Error('scrapAuthors 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰의 썸네일 URL을 스크래핑합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 썸네일 URL
     */
    async scrapThumbnailUrl(page) {
        throw new Error('scrapThumbnailUrl 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰의 고유 ID를 스크래핑합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 웹툰 고유 ID
     */
    async scrapUniqueId(page) {
        throw new Error('scrapUniqueId 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰의 마지막 업데이트 날짜를 스크래핑합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 마지막 업데이트 날짜 (ISO 형식)
     */
    async scrapLastUpdatedDate(page) {
        throw new Error('scrapLastUpdatedDate 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰의 연재 시작 날짜를 스크래핑합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 연재 시작 날짜 (ISO 형식)
     */
    async scrapPublishStartDate(page) {
        throw new Error('scrapPublishStartDate 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰 URL을 생성합니다.
     * @param {string} titleId - 웹툰 ID
     * @returns {string} 웹툰 URL
     */
    getWebtoonUrl(titleId) {
        throw new Error('getWebtoonUrl 메서드를 구현해야 합니다.');
    }

    /**
     * 현재 페이지의 HTML을 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 페이지의 HTML 내용
     */
    async extractHtml(page) {
        throw new Error('extractHtml 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰의 미리보기 개수를 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<number>} 미리보기 개수
     */
    async scrapPreviewCount(page) {
        throw new Error('scrapPreviewCount 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰의 최신 무료 회차 정보를 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<{
     *   title: string,
     *   uploadDate: string,
     *   link: string,
     *   episodeNumber: number,
     *   thumbnailUrl: string
     * }>} 최신 무료 회차 정보
     */
    async scrapLatestFreeEpisode(page) {
        throw new Error('scrapLatestFreeEpisode 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰의 모든 무료 회차 정보를 수집합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<Array<{
     *   title: string,
     *   uploadDate: string,
     *   link: string,
     *   episodeNumber: number,
     *   thumbnailUrl: string
     * }>>} 무료 회차 정보 목록
     */
    async scrapFreeEpisodes(page) {
        throw new Error('scrapFreeEpisodes 메서드를 구현해야 합니다.');
    }
} 