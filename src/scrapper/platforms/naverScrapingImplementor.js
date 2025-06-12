import { ScrapingImplementor } from './scrapingImplementor.js';
import { HtmlFormatter } from '../../utils/htmlFormatter.js';

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
        
        await page.waitForSelector('.ContentMetaInfo__meta_info--GbTg4', { timeout: 5000 });
        
        const authorContainers = await page.$$('.ContentMetaInfo__meta_info--GbTg4');

        for (const container of authorContainers) {
            const categoryElements = await container.$$('.ContentMetaInfo__category--WwrCp');
            
            for (const category of categoryElements) {
                try {
                    await page.waitForSelector('a', { timeout: 1000 });
                    const linkTag = await category.$('a');
                    if (!linkTag) continue;

                    const href = await linkTag.evaluate(el => el.getAttribute('href'));
                    const name = await linkTag.evaluate(el => el.textContent.trim());
                    
                    let authorId = null;
                    if (href.includes('artistTitle')) {
                        const match = href.match(/id=(\d+)/);
                        authorId = match ? match[1] : null;
                    } else if (href.includes('community')) {
                        const match = href.match(/u\/([^?]+)/);
                        authorId = match ? match[1] : null;
                    } else {
                        console.warn('알 수 없는 구조의 링크:', href);
                        continue;
                    }

                    const fullText = await category.evaluate(el => el.textContent.trim());
                    
                    let roleText = '';
                    const parts = fullText.split(/\s+/);
                    for (const part of parts) {
                        if (part !== name) {
                            roleText += part;
                        }
                    }
                    roleText = roleText.trim();

                    const combinedRoleMap = {
                        '글/그림': 'WRITER_AND_ILLUSTRATOR',
                        '그림/글': 'WRITER_AND_ILLUSTRATOR',
                        '글/원작': 'WRITER_AND_ORIGINAL',
                        '원작/글': 'WRITER_AND_ORIGINAL',
                        '그림/원작': 'ILLUSTRATOR_AND_ORIGINAL',
                        '원작/그림': 'ILLUSTRATOR_AND_ORIGINAL',

                        '글/그림/원작': 'WRITER_AND_ILLUSTRATOR_AND_ORIGINAL',
                        '글/원작/그림': 'WRITER_AND_ILLUSTRATOR_AND_ORIGINAL',
                        '그림/글/원작': 'WRITER_AND_ILLUSTRATOR_AND_ORIGINAL',
                        '그림/원작/글': 'WRITER_AND_ILLUSTRATOR_AND_ORIGINAL',
                        '원작/글/그림': 'WRITER_AND_ILLUSTRATOR_AND_ORIGINAL',
                        '원작/그림/글': 'WRITER_AND_ILLUSTRATOR_AND_ORIGINAL'
                    };

                    const singleRoleMap = {
                        '글': 'WRITER',
                        '그림': 'ILLUSTRATOR',
                        '원작': 'ORIGINAL',
                        '작가': 'AUTHOR'
                    };

                    let role = null;
                    
                    for (const [key, value] of Object.entries(combinedRoleMap)) {
                        if (roleText.includes(key)) {
                            role = value;
                            break;
                        }
                    }

                    if (!role) {
                        for (const [key, value] of Object.entries(singleRoleMap)) {
                            if (roleText.includes(key)) {
                                role = value;
                                break;
                            }
                        }
                    }

                    if (role && authorId && name) {
                        authors.push({ id: authorId, name, role });
                    }
                } catch (error) {
                    console.error('작가 정보 추출 중 오류:', error);
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

    async extractHtml(page) {
        // 페이지가 완전히 로드될 때까지 기다림
        await page.waitForSelector('.EpisodeListInfo__title--mYLjC', { timeout: 10000 }); // 웹툰 제목
        await page.waitForSelector('.EpisodeListList__item--M8zq4', { timeout: 10000 }); // 에피소드 목록
        await page.waitForSelector('.EpisodeListInfo__summary_wrap--ZWNW5', { timeout: 10000 }); // 웹툰 설명

        // React 렌더링이 완료될 때까지 추가로 대기
        await page.waitForTimeout(2000);

        // 스크롤을 조금 내려서 지연 로딩되는 컨텐츠들을 불러옴
        await page.evaluate(() => {
            window.scrollBy(0, 500);
            return new Promise(resolve => setTimeout(resolve, 1000));
        });

        const html = await page.evaluate(() => {
            // style 태그 제거
            const styleElements = document.querySelectorAll('style');
            styleElements.forEach(style => style.remove());

            const doctype = new XMLSerializer().serializeToString(document.doctype);
            const html = document.documentElement.outerHTML;
            return doctype + html;
        });

        // HTML 포맷팅
        return await HtmlFormatter.format(html);
    }

    /**
     * 웹툰의 미리보기 개수를 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<number>} 미리보기 개수
     */
    async scrapPreviewCount(page) {
        try {
            await page.waitForSelector('.EpisodeListPreview__text_area--WMXZz', { timeout: 10000 });

            const previewCount = await page.evaluate(() => {
                const element = document.querySelector('.EpisodeListPreview__text_area--WMXZz strong');
                if (!element) return 0;
                
                const count = parseInt(element.textContent.replace(/[^0-9]/g, ''));
                return isNaN(count) ? 0 : count;
            });

            return previewCount;
        } catch (error) {
            console.error('미리보기 개수 추출 중 오류 발생:', error);
            return 0;
        }
    }

    /**
     * 웹툰의 최신 무료 회차 정보를 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<{
     *   title: string,
     *   uploadDate: string,
     *   link: string,
     *   episodeNumber: number
     * }>} 최신 무료 회차 정보
     */
    async scrapLatestFreeEpisode(page) {
        try {
            await page.waitForSelector('.EpisodeListList__episode_list--_N3ks', { timeout: 10000 });
            
            const latestEpisode = await page.evaluate(() => {
                const firstItem = document.querySelector('.EpisodeListList__item--M8zq4');
                if (!firstItem) return null;

                const titleElement = firstItem.querySelector('.EpisodeListList__title--lfIzU');
                const dateElement = firstItem.querySelector('.date');
                const linkElement = firstItem.querySelector('a');

                if (!titleElement || !dateElement || !linkElement) return null;

                const link = linkElement.getAttribute('href');
                const episodeNumber = link ? parseInt(new URLSearchParams(link.split('?')[1]).get('no')) : null;

                return {
                    title: titleElement.textContent.trim(),
                    uploadDate: dateElement.textContent.trim(),
                    link: `https://comic.naver.com${link}`,
                    episodeNumber: episodeNumber
                };
            });

            if (!latestEpisode) {
                throw new Error('최신 무료 회차 정보를 찾을 수 없습니다.');
            }

            // 날짜 포맷 변환 (YY.MM.DD -> YYYY-MM-DD)
            latestEpisode.uploadDate = this.formatDate(latestEpisode.uploadDate);

            return latestEpisode;
        } catch (error) {
            console.error('최신 무료 회차 정보 추출 중 오류 발생:', error);
            throw error;
        }
    }
} 