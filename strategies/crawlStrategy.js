/**
 * @typedef {Object} CrawlResult
 * @property {number} statusCode - HTTP 상태 코드
 * @property {Object} data - 크롤링 결과 데이터
 */

/**
 * 크롤링 전략 인터페이스
 * @interface
 */
export class CrawlStrategy {
    /**
     * 크롤링을 실행합니다.
     * @param {import('puppeteer').Browser} browser - Puppeteer 브라우저 인스턴스
     * @param {Object} data - 크롤링에 필요한 데이터
     * @returns {Promise<CrawlResult>} 크롤링 결과
     */
    async execute(browser, data) {
        throw new Error('크롤링 전략의 execute 메서드를 구현해야 합니다.');
    }
} 