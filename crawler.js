// crawler.js
export const DEFAULT_VIEWPORT = {
    deviceScaleFactor: 1,
    hasTouch: false,
    height: 1080,
    isLandscape: true,
    isMobile: false,
    width: 1920,
};

/**
 * 웹툰 제목을 크롤링합니다.
 * @param {import('puppeteer').Browser} browser - Puppeteer 브라우저 인스턴스
 * @param {string} titleId - 네이버 웹툰의 titleId
 * @returns {Promise<string>} 웹툰 제목
 */
export async function crawlWebtoonTitle(browser, titleId) {
    const page = await browser.newPage();
    await page.goto(`https://comic.naver.com/webtoon/list?titleId=${titleId}`, {
        waitUntil: 'networkidle2',
    });

    // 해당 클래스에서 텍스트 추출
    const title = await page.$eval(
        'h2.EpisodeListInfo__title--mYLjC',
        (el) => el.textContent.trim()
    );

    await page.close();
    return title;
} 