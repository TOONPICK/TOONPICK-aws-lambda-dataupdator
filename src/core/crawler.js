import { WebtoonContentCollector } from '../collectors/webtoonContentCollector.js';
import { WebtoonUpdateCollector } from '../collectors/webtoonUpdateCollector.js';
import { ScraperFactory } from '../scrapers/scraperFactory.js';

export class Crawler {
    /**
     * @param {import('../browsers/browserType.js').BrowserType} browserType
     */
    constructor(browserType) {
        this.browserType = browserType;
        this.scraperFactory = new ScraperFactory();
        this.collectors = new Map([
            ['WEBTOON_CONTENT', new WebtoonContentCollector(this.scraperFactory)],
            ['WEBTOON_UPDATE', new WebtoonUpdateCollector(this.scraperFactory)]
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
            },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection'
            ]
        });
        try {
            const collector = this.collectors.get(body.eventType);
            if (!collector) {
                throw new Error(`지원하지 않는 이벤트 타입입니다: ${body.eventType}`);
            }
            // data가 배열이면 여러 건 처리, 아니면 단일 처리
            const dataList = Array.isArray(body.data) ? body.data : [body.data];
            const results = [];
            for (const dataItem of dataList) {
                try {
                    const result = await collector.execute(browser, dataItem);
                    results.push({
                        statusCode: result.statusCode,
                        body: JSON.stringify({
                            requestId: body.requestId,
                            ...result.data
                        }),
                        success: true
                    });
                } catch (error) {
                    results.push({
                        statusCode: 500,
                        body: JSON.stringify({
                            requestId: body.requestId,
                            error: error.message
                        }),
                        success: false,
                        error: error.message
                    });
                }
            }
            return results;
        } catch (error) {
            console.error('크롤링 실패:', error);
            return [{
                statusCode: 500,
                body: JSON.stringify({
                    requestId: body.requestId,
                    error: error.message
                }),
                success: false,
                error: error.message
            }];
        } finally {
            await browser.close();
        }
    }
} 