// index.js
import { Crawler } from './src/core/crawler.js';
import { LambdaBrowser } from './src/browsers/lambdaBrowser.js';
import { parseCrawlRequest } from './src/types/sqs.js';
import { validateEnvironmentVariables } from './src/config/env.js';
import { SQSService } from './src/utils/sqsService.js';
import { SlackService } from './src/utils/slackService.js';

async function validateAndParseRequest(event) {
    await validateEnvironmentVariables();
    if (!event.Records || !event.Records[0]) {
        throw new Error('SQS 메시지가 없습니다.');
    }
    const record = event.Records[0];
    const request = parseCrawlRequest(record);
    const requestId = request.requestId || record.messageId || `req-${Date.now()}`;
    return { request, requestId };
}

async function runCrawling(request) {
    const browserType = new LambdaBrowser();
    const crawler = new Crawler(browserType);
    return await crawler.execute(request);
}

function buildContext(request, processingTime) {
    return {
        platform: request?.data?.platform || 'Unknown',
        type: request?.data?.type || 'Unknown',
        processingTime
    };
}

async function notifySuccess(result, requestId, context) {
    const sqsService = new SQSService();
    const slackService = new SlackService();
    const sqsResult = await sqsService.sendResult(result, requestId);
    try {
        await slackService.sendSuccess(result, requestId, context);
    } catch (slackError) {
        console.warn('Slack 알림 전송 실패 (크롤링은 성공):', slackError.message);
    }
    return sqsResult;
}

async function notifyError(error, requestId, context) {
    const sqsService = new SQSService();
    const slackService = new SlackService();
    try {
        await sqsService.sendError(error, requestId, context);
        try {
            await slackService.sendError(error, requestId, context);
        } catch (slackError) {
            console.warn('Slack 에러 알림 전송 실패:', slackError.message);
        }
    } catch (notificationError) {
        console.error('알림 전송 실패:', notificationError);
    }
}

export async function handler(event) {
    const startTime = Date.now();
    let requestId = null;
    let request = null;
    try {
        // 환경 변수 검증 및 요청 파싱
        ({ request, requestId } = await validateAndParseRequest(event));
        console.log(`크롤링 요청 시작: ${requestId}`, {
            platform: request.data?.platform,
            type: request.data?.type,
            url: request.data?.url
        });
        // 크롤링 실행
        const result = await runCrawling(request);
        const processingTime = Date.now() - startTime;
        const context = buildContext(request, processingTime);
        // 결과 알림
        const sqsResult = await notifySuccess(result, requestId, context);
        console.log(`크롤링 완료: ${requestId}`, {
            processingTime,
            sqsMessageId: sqsResult.messageId,
            dataCount: Array.isArray(result) ? result.length : 1
        });
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                requestId,
                processingTime,
                sqsMessageId: sqsResult.messageId,
                dataCount: Array.isArray(result) ? result.length : 1
            })
        };
    } catch (error) {
        const processingTime = Date.now() - startTime;
        const context = buildContext(request, processingTime);
        console.error(`크롤링 실패: ${requestId}`, {
            error: error.message,
            stack: error.stack,
            processingTime
        });
        await notifyError(error, requestId, context);
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
