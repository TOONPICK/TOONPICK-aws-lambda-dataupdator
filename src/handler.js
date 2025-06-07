const WebtoonCrawler = require('../services/WebtoonCrawler');
const { successResponse, errorResponse } = require('../utils/response');

exports.handler = async (event, context) => {
  const crawler = new WebtoonCrawler();
  
  try {
    await crawler.initialize();
    
    const url = event.url || 'https://comic.naver.com/webtoon/list?titleId=747271';
    const result = await crawler.crawlWebtoonTitle(url);
    
    return successResponse(result);
  } catch (error) {
    console.error('에러 발생:', error);
    return errorResponse(error);
  } finally {
    await crawler.cleanup();
  }
}; 