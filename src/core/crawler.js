import { WebtoonContentCollector } from '../collectors/webtoonContentCollector.js';
import { WebtoonUpdateCollector } from '../collectors/webtoonUpdateCollector.js';
import { NewWebtoonCollector } from '../collectors/newWebtoonCollector.js';
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
            ['WEBTOON_UPDATE', new WebtoonUpdateCollector(this.scraperFactory)],
            ['NEW_WEBTOON', new NewWebtoonCollector(this.scraperFactory)]
        ]);
    }

    /**
     * 크롤링을 실행합니다.
     * @param {Object} body - SQS 메시지 body
     * @returns {Promise<Object>} 크롤링 결과
     */
    async execute(body) {
        const browser = await this.browserType.launch();
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
                        data: result.data,
                        success: true
                    });
                } catch (error) {
                    results.push({
                        statusCode: 500,
                        data: {
                            error: error.message
                        },
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
                data: {
                    error: error.message
                },
                success: false,
                error: error.message
            }];
        } finally {
            await browser.close();
        }
    }
} 