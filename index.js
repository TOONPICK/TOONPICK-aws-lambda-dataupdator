// index.js
import { Crawler } from './crawler.js';
import { LambdaBrowserFactory } from './factories/lambdaBrowserFactory.js';

export async function handler(event) {
    // SQS 이벤트에서 첫 번째 레코드를 처리
    if (!event.Records || !event.Records[0]) {
        throw new Error('SQS 메시지가 없습니다.');
    }

    const record = event.Records[0];
    const body = JSON.parse(record.body);
    
    // 크롤러 실행
    const browserFactory = new LambdaBrowserFactory();
    const crawler = new Crawler(browserFactory);
    return await crawler.execute(body);
}
