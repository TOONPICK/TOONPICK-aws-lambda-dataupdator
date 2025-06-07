/**
 * @typedef {Object} ScrapResult
 * @property {number} statusCode - HTTP 상태 코드
 * @property {Object} data - 크롤링 결과 데이터
 */

/**
 * 스크래퍼 기본 인터페이스
 * @interface
 */
export class BaseScrapper {
    /**
     * 스크래핑을 실행합니다.
     * @param {import('puppeteer-core').Browser} browser - Puppeteer 브라우저 인스턴스
     * @param {Object} data - 스크래핑에 필요한 데이터
     * @returns {Promise<ScrapResult>} 스크래핑 결과
     */
    async execute(browser, data) {
        throw new Error('execute 메서드를 구현해야 합니다.');
    }
} 