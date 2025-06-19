/**
 * @typedef {Object} ScrapResult
 * @property {number} statusCode - HTTP 상태 코드
 * @property {Object} data - 크롤링 결과 데이터
 */

/**
 * 컨텐츠 수집기 기본 클래스
 * 브릿지 패턴의 Abstraction 역할
 * @abstract
 */
export class ContentCollector {
    /**
     * 컨텐츠 수집을 실행합니다.
     * @param {import('puppeteer-core').Browser} browser - Puppeteer 브라우저 인스턴스
     * @param {Object} data - 수집할 데이터 정보
     * @returns {Promise<ScrapResult>} 수집 결과
     */
    async execute(browser, data) {
        throw new Error('execute 메서드를 구현해야 합니다.');
    }
} 