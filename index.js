// index.js
import { Crawler } from './src/core/crawler.js';
import { LambdaBrowser } from './src/browsers/lambdaBrowser.js';
import { parseCrawlRequest } from './src/types/sqs.js';

export async function handler(event) {
    // SQS 이벤트에서 첫 번째 레코드를 처리
    if (!event.Records || !event.Records[0]) {
        throw new Error('SQS 메시지가 없습니다.');
    }

    const record = event.Records[0];
    const request = parseCrawlRequest(record);
    
    // 브라우저와 크롤러 생성
    const browserType = new LambdaBrowser();
    const crawler = new Crawler(browserType);
    
    return await crawler.execute(request);
}
