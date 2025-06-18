import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { getEnvVar } from '../config/env.js';

export class SQSService {
    constructor() {
        this.client = null;
        this.queueUrl = null;
        this.initialized = false;
    }

    /**
     * 서비스 초기화 (Parameter Store에서 설정 가져오기)
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            const [region, queueUrl] = await Promise.all([
                getEnvVar('SQS_RESULT_QUEUE_REGION'),
                getEnvVar('SQS_RESULT_QUEUE_URL')
            ]);

            this.client = new SQSClient({ region });
            this.queueUrl = queueUrl;
            this.initialized = true;
            
            console.log('SQS 서비스 초기화 완료');
        } catch (error) {
            console.error('SQS 서비스 초기화 실패:', error);
            throw new Error(`SQS 서비스 초기화 실패: ${error.message}`);
        }
    }

    /**
     * 크롤링 결과를 SQS로 전송
     * @param {Object} result - 크롤링 결과 데이터
     * @param {string} requestId - 요청 ID (메시지 그룹 ID로 사용)
     * @returns {Promise<Object>} 전송 결과
     */
    async sendResult(result, requestId) {
        await this.initialize();

        try {
            const messageBody = JSON.stringify({
                timestamp: new Date().toISOString(),
                requestId: requestId,
                data: result,
                status: 'completed'
            });

            const command = new SendMessageCommand({
                QueueUrl: this.queueUrl,
                MessageBody: messageBody,
                MessageGroupId: requestId,
                MessageDeduplicationId: `${requestId}-${Date.now()}`
            });

            const response = await this.client.send(command);
            
            console.log(`SQS 메시지 전송 성공: ${response.MessageId}`);
            return {
                success: true,
                messageId: response.MessageId,
                requestId: requestId
            };
        } catch (error) {
            console.error('SQS 메시지 전송 실패:', error);
            throw new Error(`SQS 전송 실패: ${error.message}`);
        }
    }

    /**
     * 에러 정보를 SQS로 전송
     * @param {Error} error - 에러 객체
     * @param {string} requestId - 요청 ID
     * @param {Object} context - 추가 컨텍스트 정보
     * @returns {Promise<Object>} 전송 결과
     */
    async sendError(error, requestId, context = {}) {
        await this.initialize();

        try {
            const messageBody = JSON.stringify({
                timestamp: new Date().toISOString(),
                requestId: requestId,
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                },
                context: context,
                status: 'failed'
            });

            const command = new SendMessageCommand({
                QueueUrl: this.queueUrl,
                MessageBody: messageBody,
                MessageGroupId: requestId,
                MessageDeduplicationId: `${requestId}-error-${Date.now()}`
            });

            const response = await this.client.send(command);
            
            console.log(`SQS 에러 메시지 전송 성공: ${response.MessageId}`);
            return {
                success: true,
                messageId: response.MessageId,
                requestId: requestId
            };
        } catch (sqsError) {
            console.error('SQS 에러 메시지 전송 실패:', sqsError);
            throw new Error(`SQS 에러 전송 실패: ${sqsError.message}`);
        }
    }
} 