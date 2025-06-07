const chromium = require('chrome-aws-lambda');

exports.handler = async (event, context) => {
  let result = null;
  let browser = null;

  try {
    console.log('브라우저를 시작합니다...');
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    console.log('새 페이지를 생성합니다...');
    const page = await browser.newPage();

    // 페이지로 이동
    console.log('웹툰 페이지로 이동합니다...');
    await page.goto('https://comic.naver.com/webtoon/list?titleId=747271', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // 제목 추출
    console.log('제목을 추출합니다...');
    const title = await page.evaluate(() => {
      const titleElement = document.querySelector('h2.EpisodeListInfo__title--mYLjC');
      return titleElement ? titleElement.textContent : null;
    });

    result = {
      statusCode: 200,
      body: JSON.stringify({
        pageUrl: 'https://comic.naver.com/webtoon/list?titleId=747271',
        title: title,
        success: title === '나노마신',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('에러 발생:', error);
    result = {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  return result;
}; 