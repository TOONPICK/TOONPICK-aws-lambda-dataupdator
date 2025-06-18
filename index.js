// index.js
import { Crawler } from './src/core/crawler.js';
import { LambdaBrowser } from './src/browsers/lambdaBrowser.js';
import { parseCrawlRequest } from './src/types/sqs.js';
import { validateEnvironmentVariables } from './src/config/env.js';
import { SQSService } from './src/utils/sqsService.js';
import { SlackService } from './src/utils/slackService.js';

export async function handler(event) {
    const startTime = Date.now();
    let requestId = null;
    let request = null;
    
    try {
        // 환경 변수 검증 (Parameter Store에서 가져옴)
        await validateEnvironmentVariables();
        
        // SQS 이벤트에서 첫 번째 레코드를 처리
        if (!event.Records || !event.Records[0]) {
            throw new Error('SQS 메시지가 없습니다.');
        }

        const record = event.Records[0];
        request = parseCrawlRequest(record);
        requestId = request.requestId || record.messageId || `req-${Date.now()}`;
        
        console.log(`크롤링 요청 시작: ${requestId}`, {
            platform: request.platform,
            type: request.type,
            url: request.url
        });
        
        // 브라우저와 크롤러 생성
        const browserType = new LambdaBrowser();
        const crawler = new Crawler(browserType);
        
        // 크롤링 실행
        const result = await crawler.execute(request);
        
        const processingTime = Date.now() - startTime;
        const context = {
            platform: request.platform,
            type: request.type,
            processingTime: processingTime
        };
        
        // SQS와 Slack 서비스 초기화
        const sqsService = new SQSService();
        const slackService = new SlackService();
        
        // 결과를 SQS로 전송
        const sqsResult = await sqsService.sendResult(result, requestId);
        
        // 성공 알림을 Slack으로 전송
        const slackResult = await slackService.sendSuccess(result, requestId, context);
        
        console.log(`크롤링 완료: ${requestId}`, {
            processingTime: processingTime,
            sqsMessageId: sqsResult.messageId,
            dataCount: Array.isArray(result) ? result.length : 1
        });
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                requestId: requestId,
                processingTime: processingTime,
                sqsMessageId: sqsResult.messageId,
                dataCount: Array.isArray(result) ? result.length : 1
            })
        };
        
    } catch (error) {
        const processingTime = Date.now() - startTime;
        const context = {
            platform: request?.platform || 'Unknown',
            type: request?.type || 'Unknown',
            processingTime: processingTime
        };
        
        console.error(`크롤링 실패: ${requestId}`, {
            error: error.message,
            stack: error.stack,
            processingTime: processingTime
        });
        
        try {
            // SQS와 Slack 서비스 초기화
            const sqsService = new SQSService();
            const slackService = new SlackService();
            
            // 에러 정보를 SQS로 전송
            await sqsService.sendError(error, requestId, context);
            
            // 에러 알림을 Slack으로 전송
            await slackService.sendError(error, requestId, context);
            
        } catch (notificationError) {
            console.error('알림 전송 실패:', notificationError);
        }
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                requestId: requestId,
                error: error.message,
                processingTime: processingTime
            })
        };
    }
}
