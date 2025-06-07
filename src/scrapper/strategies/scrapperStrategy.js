/**
 * 스크래핑 전략 인터페이스
 * @interface
 */
export class ScrapperStrategy {
    /**
     * 스크래핑을 실행합니다.
     * @param {import('puppeteer-core').Browser} browser - Puppeteer 브라우저 인스턴스
     * @param {import('../../types/webtoon.js').WebtoonData} data - 스크래핑할 데이터
     * @returns {Promise<{statusCode: number, data: import('../../types/webtoon.js').WebtoonScrapResult}>}
     */
    async execute(browser, data) {
        throw new Error('execute 메서드를 구현해야 합니다.');
    }
} 