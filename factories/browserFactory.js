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
     * @param {import('../browsers/browserTypes.js').BrowserType} browserType
     */
    constructor(browserType) {
        this.browserType = browserType;
    }

    /**
     * 브라우저를 생성합니다.
     * @returns {Promise<import('puppeteer-core').Browser>}
     */
    async createBrowser() {
        return this.browserType.launch({
            defaultViewport: DEFAULT_VIEWPORT
        });
    }
} 