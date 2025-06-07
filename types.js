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
 * @typedef {Object} WebtoonCrawlData
 * @property {string} titleId - 네이버 웹툰의 titleId
 */

/**
 * @typedef {Object} SQSRequestMessage
 * @property {string} requestId - 요청을 추적하기 위한 고유 ID
 * @property {SQSEventType} eventType - 이벤트 타입
 * @property {WebtoonCrawlData} data - 실제 데이터
 * @property {string} [message] - 부가 메시지
 * @property {number} requestTime - 요청 시간 (밀리초)
 */

/**
 * @typedef {Object} WebtoonCrawlRequest
 * @property {string} titleId - 네이버 웹툰의 titleId
 * @property {string} requestId - 요청을 추적하기 위한 고유 ID
 */

/**
 * SQS 메시지로부터 WebtoonCrawlRequest를 파싱합니다.
 * @param {SQSRecord} sqsRecord - SQS 레코드 객체
 * @returns {WebtoonCrawlRequest}
 * @throws {Error} 메시지 형식이 잘못된 경우
 */
export function parseWebtoonCrawlRequest(sqsRecord) {
    try {
        // SQS 메시지의 body는 문자열로 전달됨
        const requestMessage = JSON.parse(sqsRecord.body);
        
        // SQS 메시지 구조 검증
        if (!requestMessage.eventType || !requestMessage.data) {
            throw new Error('필수 필드가 누락되었습니다: eventType, data는 필수입니다.');
        }

        // 이벤트 타입 검증
        if (requestMessage.eventType !== 'WEBTOON_CRAWL') {
            throw new Error(`지원하지 않는 이벤트 타입입니다: ${requestMessage.eventType}`);
        }

        // data 필드 검증
        if (!requestMessage.data.titleId) {
            throw new Error('필수 필드가 누락되었습니다: data.titleId는 필수입니다.');
        }

        return {
            titleId: requestMessage.data.titleId,
            requestId: requestMessage.requestId || sqsRecord.messageId
        };
    } catch (error) {
        throw new Error(`SQS 메시지 파싱 실패: ${error.message}`);
    }
} 