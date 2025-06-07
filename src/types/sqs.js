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
 * @typedef {'WEBTOON_CRAWL'} SQSEventType
 */

/**
 * @typedef {Object} SQSRequestMessage
 * @property {string} requestId - 요청을 추적하기 위한 고유 ID
 * @property {SQSEventType} eventType - 이벤트 타입
 * @property {Object} data - 실제 데이터 (이벤트 타입에 따라 다른 형식)
 * @property {string} [message] - 부가 메시지
 * @property {number} requestTime - 요청 시간 (밀리초)
 */

/**
 * @typedef {Object} CrawlRequest
 * @property {string} requestId - 요청을 추적하기 위한 고유 ID
 * @property {Object} data - 크롤링에 필요한 데이터
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
        
        // SQS 메시지 구조 검증
        if (!requestMessage.eventType || !requestMessage.data) {
            throw new Error('필수 필드가 누락되었습니다: eventType, data는 필수입니다.');
        }

        return {
            requestId: requestMessage.requestId || sqsRecord.messageId,
            data: requestMessage.data
        };
    } catch (error) {
        throw new Error(`SQS 메시지 파싱 실패: ${error.message}`);
    }
} 