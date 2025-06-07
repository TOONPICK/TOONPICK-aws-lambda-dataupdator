import { WebtoonScrapper } from '../scrapper/webtoonScrapper.js';
import { DEFAULT_VIEWPORT } from '../config/browser.js';

export class Crawler {
    /**
     * @param {import('../browsers/browserType.js').BrowserType} browserType
     */
    constructor(browserType) {
        this.browserType = browserType;
        this.scrappers = new Map([
            ['WEBTOON_CRAWL', new WebtoonScrapper()]
        ]);
    }

    /**
     * 크롤링을 실행합니다.
     * @param {import('../types/sqs.js').CrawlRequest} request - 크롤링 요청
     * @returns {Promise<Object>} 크롤링 결과
     */
    async execute(request) {
        const browser = await this.browserType.launch({
            defaultViewport: DEFAULT_VIEWPORT
        });
        
        try {
            const scrapper = this.scrappers.get('WEBTOON_CRAWL');
            if (!scrapper) {
                throw new Error('스크래퍼를 찾을 수 없습니다.');
            }

            const result = await scrapper.execute(browser, request.data);
            return {
                statusCode: result.statusCode,
                body: JSON.stringify({
                    requestId: request.requestId,
                    ...result.data
                })
            };
        } catch (error) {
            console.error('크롤링 실패:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({
                    requestId: request.requestId,
                    error: error.message
                })
            };
        } finally {
            await browser.close();
        }
    }
} 