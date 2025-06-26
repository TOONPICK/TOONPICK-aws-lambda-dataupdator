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
     * @param {import('../types/sqs.js').CrawlRequest} request - SQS 메시지 body
     * @returns {Promise<import('../types/sqs.js').CrawlResult>} CrawlResult 단일 객체
     */
    async execute(request) {
        // 요청 파싱
        const { requestId, eventType, data } = request;

        // 브라우저 실행
        const browser = await this.browserType.launch();
        try {
            const collector = this.collectors.get(eventType);
            if (!collector) {
                throw new Error(`지원하지 않는 이벤트 타입입니다: ${eventType}`);
            }
            // data가 배열이면 여러 건 처리, 아니면 단일 처리
            const results = [];
            const requestDatas = Array.isArray(data) ? data : [data];
            for (const requestData of requestDatas) {
                try {
                    const collectorResult = await collector.execute(browser, requestData);
                    if (Array.isArray(collectorResult)) {
                        results.push(...collectorResult);
                    } else {
                        results.push(collectorResult);
                    }
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

            // SQSResponseMessage 단일 객체로 반환
            const statusCode = results.some(r => r.statusCode === 500) ? 500 : 200;
            return {
                requestId: requestId || `req-${Date.now()}`,
                eventType,
                data: results,
                message: (statusCode === 200 ? '크롤링이 성공적으로 완료되었습니다.' : '크롤링 처리 중 오류가 발생했습니다.'),
                statusCode
            };
        } catch (error) {
            return {
                requestId: requestId || `req-${Date.now()}`,
                eventType,
                data: [{ error: error.message }],
                message: error.message,
                statusCode: 500
            };
        } finally {
            await browser.close();
        }
    }
} 