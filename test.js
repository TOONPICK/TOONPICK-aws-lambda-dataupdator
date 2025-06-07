import { parseWebtoonCrawlRequest } from './types.js';
import { crawlWebtoonTitle } from './crawler.js';
import { handler } from './index.js';
import assert from 'assert';

// 테스트용 SQS 메시지 생성 헬퍼 함수
function createMockSQSRecord(data, messageId = 'test-message-id') {
    const requestMessage = {
        requestId: data.requestId,
        eventType: 'WEBTOON_CRAWL',
        data: {
            titleId: data.titleId
        },
        message: data.message,
        requestTime: Date.now()
    };

    return {
        messageId: messageId,
        receiptHandle: 'test-receipt-handle',
        body: JSON.stringify(requestMessage),
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
    };
}

async function runTests() {
    console.log('테스트 시작...');

    // 1. SQS 메시지 파싱 테스트 - 모든 필드 포함
    console.log('\n1. SQS 메시지 파싱 테스트 (모든 필드 포함)');
    try {
        const mockRecord = createMockSQSRecord({
            titleId: '747271',
            requestId: 'test-1',
            message: '테스트 메시지'
        });
        const request = parseWebtoonCrawlRequest(mockRecord);
        assert.strictEqual(request.titleId, '747271');
        assert.strictEqual(request.requestId, 'test-1');
        console.log('✅ 모든 필드가 포함된 메시지 파싱 성공');
    } catch (error) {
        console.error('❌ 메시지 파싱 테스트 실패:', error);
    }

    // 2. SQS 메시지 파싱 테스트 - requestId 없음
    console.log('\n2. SQS 메시지 파싱 테스트 (requestId 없음)');
    try {
        const mockRecord = createMockSQSRecord(
            { titleId: '747271' },
            'test-message-id-2'
        );
        const request = parseWebtoonCrawlRequest(mockRecord);
        assert.strictEqual(request.titleId, '747271');
        assert.strictEqual(request.requestId, 'test-message-id-2');
        console.log('✅ messageId를 requestId로 사용하는 파싱 성공');
    } catch (error) {
        console.error('❌ 메시지 파싱 테스트 실패:', error);
    }

    // 3. 잘못된 이벤트 타입 테스트
    console.log('\n3. 잘못된 이벤트 타입 테스트');
    try {
        const invalidMessage = {
            messageId: 'test',
            body: JSON.stringify({
                eventType: 'WRONG_TYPE',
                data: { titleId: '747271' }
            })
        };
        parseWebtoonCrawlRequest(invalidMessage);
        console.error('❌ 잘못된 이벤트 타입이 파싱되었습니다');
    } catch (error) {
        console.log('✅ 잘못된 이벤트 타입 감지 성공');
    }

    // 4. 필수 필드 누락 테스트
    console.log('\n4. 필수 필드 누락 테스트');
    try {
        const invalidMessage = {
            messageId: 'test',
            body: JSON.stringify({
                eventType: 'WEBTOON_CRAWL',
                data: { wrongField: 'wrong' }
            })
        };
        parseWebtoonCrawlRequest(invalidMessage);
        console.error('❌ 필수 필드가 누락된 메시지가 파싱되었습니다');
    } catch (error) {
        console.log('✅ 필수 필드 누락 감지 성공');
    }

    // 5. Lambda 핸들러 테스트
    console.log('\n5. Lambda 핸들러 테스트');
    try {
        const mockEvent = {
            Records: [
                createMockSQSRecord({
                    titleId: '747271',
                    requestId: 'test-1',
                    message: '통합 테스트'
                })
            ]
        };
        const result = await handler(mockEvent);
        assert.strictEqual(result.statusCode, 200);
        const body = JSON.parse(result.body);
        assert(body.title, '제목이 존재해야 합니다');
        assert.strictEqual(body.titleId, '747271');
        assert.strictEqual(body.requestId, 'test-1');
        console.log('✅ Lambda 핸들러 테스트 성공');
        console.log('크롤링된 제목:', body.title);
    } catch (error) {
        console.error('❌ Lambda 핸들러 테스트 실패:', error);
    }

    console.log('\n테스트 완료!');
}

runTests().catch(console.error); 