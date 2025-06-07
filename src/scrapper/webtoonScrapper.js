import { BaseScrapper } from './baseScrapper.js';

export class WebtoonScrapper extends BaseScrapper {
    /**
     * @param {import('puppeteer-core').Browser} browser
     * @param {import('../types/webtoon.js').WebtoonData} data
     * @returns {Promise<{statusCode: number, data: import('../types/webtoon.js').WebtoonScrapResult}>}
     */
    async execute(browser, data) {
        const page = await browser.newPage();
        try {
            await page.goto(`https://comic.naver.com/webtoon/list?titleId=${data.titleId}`, {
                waitUntil: 'networkidle2',
            });

            const title = await page.$eval(
                'h2.EpisodeListInfo__title--mYLjC',
                (el) => el.textContent.trim()
            );

            return {
                statusCode: 200,
                data: { title }
            };
        } finally {
            await page.close();
        }
    }
} 