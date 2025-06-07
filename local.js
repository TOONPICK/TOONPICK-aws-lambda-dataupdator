import { Crawler } from './crawler.js';
import { LocalBrowserFactory } from './factories/localBrowserFactory.js';

// 테스트용 SQS 메시지 생성
const mockSQSEvent = {
    Records: [
        {
            messageId: "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
            receiptHandle: "MessageReceiptHandle",
            body: JSON.stringify({
                requestId: 'local-test-1',
                eventType: 'WEBTOON_CRAWL',
                data: {
                    titleId: '747271'  // 나노마신
                },
                message: '로컬 테스트 실행',
                requestTime: Date.now()
            }),
            attributes: {
                ApproximateReceiveCount: "1",
                SentTimestamp: "1523232000000",
                SenderId: "123456789012",
                ApproximateFirstReceiveTimestamp: "1523232000001"
            },
            messageAttributes: {},
            md5OfBody: "7b270e59b47ff90a553787216d55d91d",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:MyQueue",
            awsRegion: "us-east-1"
        }
    ]
};

async function runLocal() {
    const body = JSON.parse(mockSQSEvent.Records[0].body);
    
    // 크롤러 실행 (로컬 환경)
    const browserFactory = new LocalBrowserFactory();
    const crawler = new Crawler(browserFactory);
    const result = await crawler.execute(body);
    
    console.log('크롤링 결과:', JSON.parse(result.body));
}

runLocal().catch(console.error); 