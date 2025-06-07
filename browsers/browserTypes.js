/**
 * @typedef {Object} BrowserConfig
 * @property {Object} defaultViewport - 브라우저 뷰포트 설정
 * @property {boolean} [headless] - 헤드리스 모드 설정
 * @property {string[]} [args] - 브라우저 시작 인자
 * @property {string} [executablePath] - 브라우저 실행 파일 경로
 * @property {boolean} [ignoreHTTPSErrors] - HTTPS 에러 무시 여부
 */

/**
 * 브라우저 타입 인터페이스
 * @interface
 */
export class BrowserType {
    /**
     * 브라우저를 실행합니다.
     * @param {BrowserConfig} config - 브라우저 설정
     * @returns {Promise<import('puppeteer-core').Browser>}
     */
    async launch(config) {
        throw new Error('launch 메서드를 구현해야 합니다.');
    }
} 