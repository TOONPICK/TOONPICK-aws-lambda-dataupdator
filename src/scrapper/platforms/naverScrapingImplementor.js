import { ScrapingImplementor } from './scrapingImplementor.js';

export class NaverScrapingImplementor extends ScrapingImplementor {
    async scrapTitle(page, titleId) {
        await page.goto(this.getWebtoonUrl(titleId), {
            waitUntil: 'networkidle2',
        });

        return await page.$eval(
            'h2.EpisodeListInfo__title--mYLjC',
            (el) => el.textContent.trim()
        );
    }

    async scrapDayOfWeek(page) {
        const metaInfo = await page.$('.ContentMetaInfo__meta_info--GbTg4');
        const dayText = await metaInfo.$eval('.ContentMetaInfo__info_item--utGrf', el => el.textContent.trim());
        const dayMatch = dayText.match(/(월|화|수|목|금|토|일)/);
        return dayMatch ? dayMatch[1] : null;
    }

    async scrapStatus(page) {
        const metaInfo = await page.$('.ContentMetaInfo__meta_info--GbTg4');
        const statusText = await metaInfo.$eval('.ContentMetaInfo__info_item--utGrf', el => el.textContent.trim());
        const absenceInfo = await page.$$('.EpisodeListInfo__info_text--MO6kz');
        
        for (const element of absenceInfo) {
            const text = await element.evaluate(el => el.textContent.trim());
            if (text === '휴재') return 'HIATUS';
        }
        
        return statusText.includes('완결') ? 'COMPLETED' : 'ONGOING';
    }

    async scrapAgeRating(page) {
        const metaInfo = await page.$('.ContentMetaInfo__meta_info--GbTg4');
        const ageText = await metaInfo.$eval('.ContentMetaInfo__info_item--utGrf', el => el.textContent.trim());
        const ageMatch = ageText.match(/(전체연령가|12세|15세|19세)/);
        
        if (ageMatch) {
            const ageMap = {
                '전체연령가': 'ALL',
                '12세': 'AGE_12',
                '15세': 'AGE_15',
                '19세': 'ADULT'
            };
            return ageMap[ageMatch[1]];
        }
        return null;
    }

    async scrapGenres(page) {
        try {
            const expandButton = await page.$('.EpisodeListInfo__button_fold--ZKgEw');
            if (expandButton) {
                await expandButton.click();
            }
        } catch (error) {
            console.debug('장르 카테고리 펼치기 버튼이 없거나 클릭할 수 없습니다');
        }

        const genres = await page.$$eval('.TagGroup__tag--xu0OH', 
            elements => elements.map(el => el.textContent.trim().replace('#', ''))
        );
        return genres.filter(genre => genre);
    }

    async scrapEpisodeCount(page) {
        const countText = await page.$eval(
            '.EpisodeListView__count--fTMc5',
            el => el.textContent.trim()
        );
        const match = countText.match(/\d+/);
        return match ? parseInt(match[0]) : null;
    }

    async scrapDescription(page) {
        return await page.$eval(
            '.EpisodeListInfo__summary_wrap--ZWNW5 p',
            el => el.textContent.trim()
        );
    }

    async scrapAuthors(page) {
        const authors = [];
        const authorElements = await page.$$('.ContentMetaInfo__meta_info--GbTg4');

        for (const element of authorElements) {
            const categoryElements = await element.$$('.ContentMetaInfo__category--WwrCp');
            
            for (const category of categoryElements) {
                const linkTag = await category.$('a');
                const href = await linkTag.evaluate(el => el.getAttribute('href'));
                const name = await linkTag.evaluate(el => el.textContent.trim());
                
                let authorId;
                let url;
                
                if (href.includes('artistTitle')) {
                    const match = href.match(/id=(\d+)/);
                    authorId = match ? match[1] : null;
                    url = href;
                } else if (href.includes('community')) {
                    const match = href.match(/u\/([^?]+)/);
                    authorId = match ? match[1] : null;
                    url = href.split('?')[0];
                } else {
                    console.warn('알 수 없는 구조의 링크:', href);
                    continue;
                }

                const roleText = await category.evaluate(el => el.textContent.trim().split(' ').pop());
                const roleMap = {
                    '작가': 'AUTHOR',
                    '글': 'WRITER',
                    '그림': 'ILLUSTRATOR'
                };
                const role = roleMap[roleText] || null;

                if (role) {
                    authors.push({ id: authorId, name, role });
                }
            }
        }

        return authors;
    }

    async scrapThumbnailUrl(page) {
        return await page.$eval(
            '.Poster__thumbnail_area--gviWY img',
            el => el.getAttribute('src')
        );
    }

    async scrapUniqueId(page) {
        const url = await page.url();
        const match = url.match(/titleId=(\d+)/);
        return match ? match[1] : null;
    }

    async scrapLastUpdatedDate(page) {
        const firstItem = await page.$('.EpisodeListList__item--M8zq4');
        if (!firstItem) return null;

        const dateText = await firstItem.$eval('.date', el => el.textContent.trim());
        return this.formatDate(dateText);
    }

    async scrapPublishStartDate(page) {
        const currentUrl = await page.url();
        await page.goto(`${currentUrl}&page=1&sort=ASC`);

        const firstItem = await page.$('.EpisodeListList__item--M8zq4');
        if (!firstItem) return null;

        const dateText = await firstItem.$eval('.date', el => el.textContent.trim());
        const formattedDate = this.formatDate(dateText);

        // 원래 페이지로 돌아가기
        await page.goto(currentUrl);

        return formattedDate;
    }

    formatDate(dateStr) {
        const [year, month, day] = dateStr.split('.');
        return `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    getWebtoonUrl(titleId) {
        return `https://comic.naver.com/webtoon/list?titleId=${titleId}`;
    }
} 