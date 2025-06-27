import { Crawler } from './src/core/crawler.js';
import { LambdaBrowser } from './src/browsers/lambdaBrowser.js';
import { parseCrawlRequest, createSQSResponseMessage } from './src/types/sqs.js';
import { loadEnv } from './src/env/index.js';
import { SSMCoreClient, SQSCoreClient } from './src/aws/index.js';
import { SlackCoreClient } from './src/notification/index.js';

const sqsMessageFormatter = (payload, type, options) => {
    const { requestId, eventType } = options;

    return createSQSResponseMessage(
        requestId,
        eventType,
        payload,
        '크롤링 결과가 성공적으로 처리되었습니다.'
    );
};

const slackMessageFormatter = (payload, type, options) => {
    const { requestId, processingTime, totalResults, successCount, failCount, notificationErrors } = options;
    
    if (type === 'error') {
        return {
            icon_emoji: ':x:',
            attachments: [
                {
                    color: 'danger',
                    title: '웹툰 크롤링 실패',
                    fields: [
                        { title: '요청 ID', value: requestId, short: true },
                        { title: '에러 메시지', value: payload.message, short: false },
                        { title: '에러 타입', value: payload.name || 'Unknown', short: true },
                        { title: '처리 시간', value: processingTime ? `${processingTime}ms` : 'Unknown', short: true }
                    ],
                    footer: 'Webtoon Crawler',
                    ts: Math.floor(Date.now() / 1000)
                }
            ]
        };
    }
    
    // 성공 메시지 - 전체 프로세스 종합 정보
    const color = failCount > 0 ? 'warning' : 'good';
    const title = failCount > 0 ? '웹툰 크롤링 부분 성공' : '웹툰 크롤링 완전 성공';
    const icon = failCount > 0 ? ':warning:' : ':white_check_mark:';
    
    const fields = [
        { title: '요청 ID', value: requestId, short: true },
        { title: '전체 결과 수', value: totalResults || 0, short: true },
        { title: '성공', value: successCount || 0, short: true },
        { title: '실패', value: failCount || 0, short: true },
        { title: '처리 시간', value: processingTime ? `${processingTime}ms` : 'Unknown', short: true }
    ];
    
    // 알림 전송 실패가 있는 경우 추가 정보
    if (notificationErrors && notificationErrors.length > 0) {
        const failedNotifications = notificationErrors.map(e => e.type).join(', ');
        fields.push({ 
            title: '알림 전송 실패', 
            value: failedNotifications, 
            short: true 
        });
    }
    
    return {
        icon_emoji: icon,
        attachments: [
            {
                color: color,
                title: title,
                fields: fields,
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
            eventType: request.eventType
        });
        // 크롤링 실행
        const browserType = new LambdaBrowser();
        const crawler = new Crawler(browserType);
        const results = await crawler.execute(request);
        
        const processingTime = Date.now() - startTime;
        
        // SQS/Slack 알림 전송
        let sqsMessageIds = [];
        let notificationErrors = [];
        let sqsSuccessCount = 0;
        let sqsFailCount = 0;
        
        // 각 결과를 개별적으로 SQS로 전송
        for (const result of results.data) {
            try {

                console.log("result : >>>> ", result);
                console.log("results.eventType : >>>> ", results.eventType);

                const sqsResult = await sqsClient.send(result, {
                    requestId,
                    eventType: results.eventType
                });
                sqsMessageIds.push(sqsResult.MessageId);
                sqsSuccessCount++;
            } catch (sqsError) {
                console.error('SQS 전송 실패:', sqsError.message, {
                    requestId,
                    resultEventType: results.eventType,
                    error: sqsError.message
                });
                sqsFailCount++;
                notificationErrors.push({ type: 'SQS', error: sqsError });
            }
        }
        
        // Slack 알림 전송 (전체 프로세스 종합 정보)
        try {
            const totalResults = results.data?.length || 0;
            
            await slackClient.send(results, 'success', { 
                requestId, 
                processingTime,
                totalResults,
                successCount: sqsSuccessCount,
                failCount: sqsFailCount,
                notificationErrors
            });
        } catch (slackError) {
            console.warn('Slack 알림 전송 실패:', slackError.message);
            notificationErrors.push({ type: 'Slack', error: slackError });
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: sqsFailCount === 0,
                requestId,
                processingTime,
                totalResults: results.data?.length || 0,
                sqsSuccessCount,
                sqsFailCount,
                sqsMessageIds,
                notificationErrors: notificationErrors.length > 0 ? notificationErrors.map(e => ({ type: e.type, message: e.error.message })) : null
            })
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`크롤링 실패: ${requestId}`, {
            error: error.message,
            stack: error.stack,
            processingTime
        });
        
        let notificationErrors = [];
        
        // SQS 에러 알림 전송
        try {
            await sqsClient.send(error, { requestId, type: 'error' });
        } catch (sqsError) {
            console.error('SQS 에러 알림 전송 실패:', sqsError.message);
            notificationErrors.push({ type: 'SQS', error: sqsError });
        }
        
        // Slack 에러 알림 전송 (SQS 성공/실패와 무관하게 시도)
        try {
            await slackClient.send(error, 'error', { 
                requestId, 
                processingTime,
                totalResults: 0,
                successCount: 0,
                failCount: 1,
                notificationErrors
            });
        } catch (slackError) {
            console.warn('Slack 에러 알림 전송 실패:', slackError.message);
            notificationErrors.push({ type: 'Slack', error: slackError });
        }
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                requestId,
                error: error.message,
                processingTime,
                notificationErrors: notificationErrors.length > 0 ? notificationErrors.map(e => ({ type: e.type, message: e.error.message })) : null
            })
        };
    }
}
