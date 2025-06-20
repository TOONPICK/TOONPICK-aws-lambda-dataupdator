import { Crawler } from './src/core/crawler.js';
import { LambdaBrowser } from './src/browsers/lambdaBrowser.js';
import { parseCrawlRequest, createSQSResponseMessage } from './src/types/sqs.js';
import { formatWebtoonData } from './src/types/webtoon.js';
import { loadEnv } from './src/env/index.js';
import { SSMCoreClient, SQSCoreClient } from './src/aws/index.js';
import { SlackCoreClient } from './src/notification/index.js';

const sqsMessageFormatter = (payload, type, options) => {
    const { requestId, context = {} } = options;
    
    if (type === 'error') {
        return createSQSResponseMessage(
            requestId,
            context.eventType || 'CRAWL_WEBTOON_EPISODE',
            {
                error: {
                    message: payload.message,
                    stack: payload.stack,
                    name: payload.name
                },
                context: context
            },
            '크롤링 처리 중 오류가 발생했습니다.'
        );
    }
    
    // 성공 응답의 경우 payload가 이미 적절한 형식이어야 함
    // payload가 배열이면 각 항목을 개별 메시지로 처리
    if (Array.isArray(payload)) {
        return payload.map(result => 
            createSQSResponseMessage(
                requestId,
                context.eventType || 'CRAWL_WEBTOON_EPISODE',
                result.data || result,
                '크롤링이 성공적으로 완료되었습니다.'
            )
        );
    }
    
    return createSQSResponseMessage(
        requestId,
        context.eventType || 'CRAWL_WEBTOON_EPISODE',
        payload.data || payload,
        '크롤링이 성공적으로 완료되었습니다.'
    );
};

const slackMessageFormatter = (payload, type, options) => {
    const { requestId, context = {} } = options;
    if (type === 'error') {
        return {
            icon_emoji: ':x:',
            attachments: [
                {
                    color: 'danger',
                    title: '웹툰 크롤링 실패',
                    fields: [
                        { title: '요청 ID', value: requestId, short: true },
                        { title: '플랫폼', value: context.platform || 'Unknown', short: true },
                        { title: '에러 메시지', value: payload.message, short: false },
                        { title: '에러 타입', value: payload.name || 'Unknown', short: true }
                    ],
                    footer: 'Webtoon Crawler',
                    ts: Math.floor(Date.now() / 1000)
                }
            ]
        };
    }
    // 성공 메시지
    return {
        icon_emoji: ':white_check_mark:',
        attachments: [
            {
                color: 'good',
                title: '웹툰 크롤링 성공',
                fields: [
                    { title: '요청 ID', value: requestId, short: true },
                    { title: '플랫폼', value: context.platform || 'Unknown', short: true },
                    { title: '수집된 데이터 수', value: Array.isArray(payload) ? payload.length : 1, short: true },
                    { title: '처리 시간', value: context.processingTime ? `${context.processingTime}ms` : 'Unknown', short: true }
                ],
                footer: 'Webtoon Crawler',
                ts: Math.floor(Date.now() / 1000)
            }
        ]
    };
};

export async function handler(event) {
    const startTime = Date.now();
    let requestId = null;
    let request = null;
    // 환경변수 취합 (SSM + process.env)
    const ssmClient = new SSMCoreClient();
    const env = await loadEnv({ sources: ['ssm', 'process'], ssmClient });
    // SQS/Slack 클라이언트 인스턴스화
    const sqsClient = new SQSCoreClient({
        region: env.SQS_RESULT_QUEUE_REGION,
        queueUrl: env.SQS_RESULT_QUEUE_URL,
        isFifoQueue: env.SQS_RESULT_QUEUE_URL?.endsWith('.fifo'),
        messageFormatter: sqsMessageFormatter
    });
    const slackClient = new SlackCoreClient({
        webhookUrl: env.SLACK_WEBHOOK_URL,
        channel: env.SLACK_CHANNEL,
        username: env.SLACK_USERNAME,
        messageFormatter: slackMessageFormatter
    });
    try {
        // 요청 파싱
        if (!event.Records || !event.Records[0]) throw new Error('SQS 메시지가 없습니다.');
        const record = event.Records[0];
        request = parseCrawlRequest(record);
        requestId = request.requestId || record.messageId || `req-${Date.now()}`;
        console.log(`크롤링 요청 시작: ${requestId}`, {
            platform: request.data?.platform,
            type: request.data?.type,
            url: request.data?.url
        });
        // 크롤링 실행
        const browserType = new LambdaBrowser();
        const crawler = new Crawler(browserType);
        const results = await crawler.execute(request);
        
        // 크롤링 결과를 Java에서 기대하는 형식으로 포맷팅
        const formattedResults = results.map(result => {
            if (result.success && result.data) {
                return {
                    ...result,
                    data: formatWebtoonData(result.data, request.eventType)
                };
            }
            return result;
        });
        
        const processingTime = Date.now() - startTime;
        const context = {
            platform: request.data?.platform || 'Unknown',
            type: request.data?.type || 'Unknown',
            processingTime
        };
        // SQS/Slack 알림 (각 결과별로)
        let successCount = 0;
        let failCount = 0;
        let sqsMessageIds = [];
        
        // SQS 메시지 포맷터가 배열을 반환할 수 있으므로 이를 처리
        const formattedMessages = sqsMessageFormatter(formattedResults, 'success', { requestId, context });
        const messagesToSend = Array.isArray(formattedMessages) ? formattedMessages : [formattedMessages];
        
        for (const message of messagesToSend) {
            try {
                const sqsResult = await sqsClient.send(message, { requestId, type: 'result' });
                sqsMessageIds.push(sqsResult.MessageId);
                successCount++;
                
                try {
                    await slackClient.send(message, 'success', { requestId, context });
                } catch (slackError) {
                    console.warn('Slack 알림 전송 실패:', slackError.message);
                }
            } catch (sqsError) {
                console.error('SQS 전송 실패:', sqsError.message);
                failCount++;
            }
        }
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: failCount === 0,
                requestId,
                processingTime,
                sqsMessageIds,
                successCount,
                failCount,
                results: formattedResults
            })
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        const context = {
            platform: request?.data?.platform || 'Unknown',
            type: request?.data?.type || 'Unknown',
            processingTime,
            eventType: request?.eventType || 'CRAWL_WEBTOON_EPISODE'
        };
        console.error(`크롤링 실패: ${requestId}`, {
            error: error.message,
            stack: error.stack,
            processingTime
        });
        try {
            const errorMessage = sqsMessageFormatter(error, 'error', { requestId, context });
            await sqsClient.send(errorMessage, { requestId, type: 'error' });
            try {
                await slackClient.send(error, 'error', { requestId, context });
            } catch (slackError) {
                console.warn('Slack 에러 알림 전송 실패:', slackError.message);
            }
        } catch (notificationError) {
            console.error('알림 전송 실패:', notificationError);
        }
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                requestId,
                error: error.message,
                processingTime
            })
        };
    }
}
