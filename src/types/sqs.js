/**
 * @typedef {Object} SQSMessageAttribute
 * @property {string} [stringValue]
 * @property {Buffer} [binaryValue]
 * @property {string[]} [stringListValues]
 * @property {Buffer[]} [binaryListValues]
 * @property {string} dataType
 */

/**
 * @typedef {Object} SQSRecord
 * @property {string} messageId
 * @property {string} receiptHandle
 * @property {string} body
 * @property {Object} attributes
 * @property {Object.<string, SQSMessageAttribute>} messageAttributes
 * @property {string} md5OfBody
 * @property {string} eventSource
 * @property {string} eventSourceARN
 * @property {string} awsRegion
 */

/**
 * @typedef {'CRAWL_WEBTOON_EPISODE' | 'CRAWL_WEBTOON_ALL' | 'CRAWL_WEBTOON_NEW'} SQSEventType
 */

/**
 * @typedef {'CRAWL_WEBTOON_NEW' | 'CRAWL_WEBTOON_EPISODE' | 'CRAWL_WEBTOON_ALL'} SQSResponseEventType
 */

/**
 * @typedef {Object} CrawlRequest
 * @property {string} requestId - 요청을 추적하기 위한 고유 ID
 * @property {SQSEventType} eventType - 이벤트 타입
 * @property {Object} data - 크롤링에 필요한 데이터
 */

/**
 * @typedef {Object} CrawlResult
 * @property {string} requestId - 요청 고유 ID
 * @property {import('./sqs.js').SQSEventType} eventType - 이벤트 타입
 * @property {any} data - 결과 데이터(리스트)
 * @property {string} message - 부가 메시지
 * @property {number} statusCode - HTTP 상태 코드
 */

/**
 * SQS 메시지로부터 CrawlRequest를 파싱합니다.
 * @param {SQSRecord} sqsRecord - SQS 레코드 객체
 * @returns {CrawlRequest}
 * @throws {Error} 메시지 형식이 잘못된 경우
 */
export function parseCrawlRequest(sqsRecord) {
    try {
        // SQS 메시지의 body는 문자열로 전달됨
        const requestMessage = JSON.parse(sqsRecord.body);

        // eventType, data가 없고 requests가 있으면 이를 매핑
        let eventType = requestMessage.eventType;
        let data = requestMessage.data;
        if (!eventType && requestMessage.requests) {
            eventType = 'CRAWL_WEBTOON_EPISODE';
            data = requestMessage.requests;
        }

        // SQS 메시지 구조 검증
        if (!eventType || !data) {
            throw new Error('필수 필드가 누락되었습니다: eventType, data는 필수입니다.');
        }

        return {
            requestId: requestMessage.requestId || sqsRecord.messageId,
            eventType,
            data
        };
    } catch (error) {
        throw new Error(`SQS 메시지 파싱 실패: ${error.message}`);
    }
}

/**
 * Java에서 기대하는 형식의 SQS 응답 메시지를 생성합니다.
 * @param {string} requestId - 요청 ID
 * @param {SQSResponseEventType} eventType - 응답 이벤트 타입
 * @param {Object} data - 응답 데이터
 * @param {string} [message] - 부가 메시지
 * @returns {CrawlResult}
 */
export function createSQSResponseMessage(requestId, eventType, data, message = null) {
    return {
        requestId,
        eventType,
        data,
        message,
        requestTime: Date.now()
    };
} 