import { Crawler } from './src/core/crawler.js';
import { LambdaBrowser } from './src/browsers/lambdaBrowser.js';
import { parseCrawlRequest } from './src/types/sqs.js';
import { loadEnv } from './src/env/index.js';
import { SSMCoreClient, SQSCoreClient } from './src/aws/index.js';
import { SlackCoreClient } from './src/notification/index.js';

const sqsMessageFormatter = (payload, type, options) => {
    if (type === 'error') {
        return {
            timestamp: new Date().toISOString(),
            requestId: options.requestId,
            error: {
                message: payload.message,
                stack: payload.stack,
                name: payload.name
            },
            context: options.context,
            status: 'failed'
        };
    }
    return {
        timestamp: new Date().toISOString(),
        requestId: options.requestId,
        data: payload,
        status: 'completed'
    };
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
        for (const result of results) {
            try {
                const sqsResult = await sqsClient.send(result, { requestId, type: 'result' });
                sqsMessageIds.push(sqsResult.MessageId);
                if (result.success) successCount++;
                else failCount++;
                try {
                    await slackClient.send(result, result.success ? 'success' : 'error', { requestId, context });
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
                results
            })
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        const context = {
            platform: request?.data?.platform || 'Unknown',
            type: request?.data?.type || 'Unknown',
            processingTime
        };
        console.error(`크롤링 실패: ${requestId}`, {
            error: error.message,
            stack: error.stack,
            processingTime
        });
        try {
            await sqsClient.send(error, { requestId, type: 'error', context });
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
