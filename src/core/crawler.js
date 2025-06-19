import { WebtoonContentCollector } from '../scrapper/webtoonContentCollector.js';
import { WebtoonUpdateCollector } from '../scrapper/webtoonUpdateCollector.js';

export class Crawler {
    /**
     * @param {import('../browsers/browserType.js').BrowserType} browserType
     */
    constructor(browserType) {
        this.browserType = browserType;
        this.collectors = new Map([
            ['WEBTOON_CRAWL', new WebtoonContentCollector(this.scrapperFactory)],
            ['WEBTOON_UPDATE', new WebtoonUpdateCollector(this.scrapperFactory)]
        ]);
    }

    /**
     * 크롤링을 실행합니다.
     * @param {Object} body - SQS 메시지 body
     * @returns {Promise<Object>} 크롤링 결과
     */
    async execute(body) {
        const browser = await this.browserType.launch({
            defaultViewport: {
                deviceScaleFactor: 1,
                hasTouch: false,
                height: 1080,
                isLandscape: true,
                isMobile: false,
                width: 1920,
            }
        });
        try {
            const collector = this.collectors.get(body.eventType);
            if (!collector) {
                throw new Error(`지원하지 않는 이벤트 타입입니다: ${body.eventType}`);
            }
            const result = await collector.execute(browser, body.data);
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