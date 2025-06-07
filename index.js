const chromium = require('chrome-aws-lambda');

exports.handler = async (event, context) => {
  let result = null;
  let browser = null;

  try {
    console.log('브라우저를 시작합니다...');
    browser = await chromium.puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process'
      ],
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      executablePath: await chromium.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    });

    console.log('새 페이지를 생성합니다...');
    const page = await browser.newPage();

    // 페이지로 이동
    console.log('웹툰 페이지로 이동합니다...');
    await page.goto('https://comic.naver.com/webtoon/list?titleId=747271', {
      waitUntil: 'networkidle0',
      timeout: 25000
    });

    // 페이지의 HTML 구조 확인
    console.log('페이지 HTML 구조를 확인합니다...');
    const html = await page.evaluate(() => {
      return {
        title: document.title,
        h2Tags: Array.from(document.querySelectorAll('h2')).map(h2 => ({
          className: h2.className,
          text: h2.textContent,
          html: h2.outerHTML
        }))
      };
    });

    console.log('페이지 정보:', JSON.stringify(html, null, 2));

    // 제목 추출 시도
    console.log('제목을 추출합니다...');
    const title = await page.evaluate(() => {
      // 모든 h2 태그를 확인
      const h2Elements = document.querySelectorAll('h2');
      for (const h2 of h2Elements) {
        if (h2.textContent.includes('나노마신')) {
          return h2.textContent;
        }
      }
      return null;
    });

    console.log('추출된 제목:', title);

    return {
      statusCode: 200,
      body: JSON.stringify({
        pageUrl: 'https://comic.naver.com/webtoon/list?titleId=747271',
        title: title,
        success: title === '나노마신',
        timestamp: new Date().toISOString(),
        debug: html
      })
    };

  } catch (error) {
    console.error('에러 발생:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    };
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}; 