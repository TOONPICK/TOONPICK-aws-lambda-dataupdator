import { CrawlStrategy } from './crawlStrategy.js';

export class WebtoonTitleStrategy extends CrawlStrategy {
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