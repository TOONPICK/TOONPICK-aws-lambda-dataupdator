/**
 * 플랫폼별 스크래퍼 인터페이스
 * @interface
 */
export class PlatformScrapper {
    /**
     * 웹툰 제목을 스크래핑합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @param {string} titleId - 웹툰 ID
     * @returns {Promise<string>} 웹툰 제목
     */
    async scrapTitle(page, titleId) {
        throw new Error('scrapTitle 메서드를 구현해야 합니다.');
    }

    /**
     * 웹툰 URL을 생성합니다.
     * @param {string} titleId - 웹툰 ID
     * @returns {string} 웹툰 URL
     */
    getWebtoonUrl(titleId) {
        throw new Error('getWebtoonUrl 메서드를 구현해야 합니다.');
    }
} 