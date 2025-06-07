export const DEFAULT_VIEWPORT = {
    deviceScaleFactor: 1,
    hasTouch: false,
    height: 1080,
    isLandscape: true,
    isMobile: false,
    width: 1920,
};

/**
 * 브라우저 팩토리 인터페이스
 * @interface
 */
export class BrowserFactory {
    /**
     * 브라우저를 생성합니다.
     * @returns {Promise<import('puppeteer').Browser>}
     */
    async createBrowser() {
        throw new Error('createBrowser 메서드를 구현해야 합니다.');
    }
} 