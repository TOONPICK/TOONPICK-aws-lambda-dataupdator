import { WebtoonTitleStrategy } from './strategies/webtoonTitleStrategy.js';

export const DEFAULT_VIEWPORT = {
    deviceScaleFactor: 1,
    hasTouch: false,
    height: 1080,
    isLandscape: true,
    isMobile: false,
    width: 1920,
};

export class Crawler {
    /**
     * @param {import('./factories/browserFactory.js').BrowserFactory} browserFactory
     */
    constructor(browserFactory) {
        this.browserFactory = browserFactory;
        this.strategies = new Map([
            ['WEBTOON_CRAWL', new WebtoonTitleStrategy()]
        ]);
    }

    /**
     * 크롤링을 실행합니다.
     * @param {Object} body - SQS 메시지 body
     * @returns {Promise<Object>} 크롤링 결과
     */
    async execute(body) {
        const browser = await this.browserFactory.createBrowser();
        
        try {
            const strategy = this.strategies.get(body.eventType);
            if (!strategy) {
                throw new Error(`지원하지 않는 이벤트 타입입니다: ${body.eventType}`);
            }

            const result = await strategy.execute(browser, body.data);
            return {
                statusCode: result.statusCode,
                body: JSON.stringify({
                    requestId: body.requestId,
                    ...result.data
                })
            };
        } catch (error) {
            console.error('크롤링 실패:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({
                    requestId: body.requestId,
                    error: error.message
                })
            };
        } finally {
            await browser.close();
        }
    }
}

/**
 * 웹툰 제목을 크롤링합니다.
 * @param {import('puppeteer').Browser} browser - Puppeteer 브라우저 인스턴스
 * @param {string} titleId - 네이버 웹툰의 titleId
 * @returns {Promise<string>} 웹툰 제목
 */
export async function crawlWebtoonTitle(browser, titleId) {
    const page = await browser.newPage();
    await page.goto(`https://comic.naver.com/webtoon/list?titleId=${titleId}`, {
        waitUntil: 'networkidle2',
    });

    // 해당 클래스에서 텍스트 추출
    const title = await page.$eval(
        'h2.EpisodeListInfo__title--mYLjC',
        (el) => el.textContent.trim()
    );

    await page.close();
    return title;
} 