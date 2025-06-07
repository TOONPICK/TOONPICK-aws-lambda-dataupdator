const SQSRequestMessage = require('./models/SQSRequestMessage');
const BrowserManager = require('../services/BrowserManager');
const CrawlerFactory = require('../services/CrawlerFactory');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * AWS Lambda 핸들러
 * @param {Object} event - AWS SQS 이벤트
 * @param {Object} context - AWS Lambda 컨텍스트
 * @returns {Promise<Object>} Lambda 응답
 */
exports.handler = async (event, context) => {
  const browserManager = new BrowserManager();
  
  try {
    // SQS 메시지 검증
    if (!event.Records || !Array.isArray(event.Records) || event.Records.length === 0) {
      throw new Error('Invalid SQS event format');
    }

    const record = event.Records[0];
    
    // SQS 메시지 속성 검증
    if (!record.body || !record.messageId || record.eventSource !== 'aws:sqs') {
      throw new Error('Invalid SQS message format');
    }

    // SQS 메시지 파싱
    const request = SQSRequestMessage.fromJson(record.body);
    
    // 브라우저 초기화
    await browserManager.initialize();
    
    // 크롤러 생성 및 실행
    const crawler = CrawlerFactory.createCrawler(request.eventType);
    const result = await crawler.crawl(browserManager.getPage(), request.data);
    
    return successResponse({
      requestId: request.requestId,
      messageId: record.messageId,
      ...result
    });
  } catch (error) {
    console.error('에러 발생:', error);
    return errorResponse(error);
  } finally {
    await browserManager.cleanup();
  }
}; 