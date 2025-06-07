import { PlatformScrapper } from './platformScrapper.js';

export class NaverScrapper extends PlatformScrapper {
    async scrapTitle(page, titleId) {
        await page.goto(this.getWebtoonUrl(titleId), {
            waitUntil: 'networkidle2',
        });

        return await page.$eval(
            'h2.EpisodeListInfo__title--mYLjC',
            (el) => el.textContent.trim()
        );
    }

    getWebtoonUrl(titleId) {
        return `https://comic.naver.com/webtoon/list?titleId=${titleId}`;
    }
} 