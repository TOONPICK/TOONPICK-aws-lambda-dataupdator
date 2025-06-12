import { ScrapingImplementor } from './scrapingImplementor.js';
import { HtmlFormatter } from '../../utils/htmlFormatter.js';

/**
 * 네이버 웹툰 스크래핑을 구현하는 클래스입니다.
 * @extends ScrapingImplementor
 */
export class NaverScrapingImplementor extends ScrapingImplementor {
    #currentTitleId = null;
    #SELECTORS = {
        TITLE: '.EpisodeListInfo__title--mYLjC',
        EPISODE_ITEM: '.EpisodeListList__item--M8zq4',
        DESCRIPTION: '.EpisodeListInfo__summary_wrap--ZWNW5',
        META_INFO: '.ContentMetaInfo__meta_info--GbTg4',
        META_INFO_ITEM: '.ContentMetaInfo__info_item--utGrf',
        EPISODE_COUNT: '.EpisodeListView__count--fTMc5',
        PREVIEW_AREA: '.EpisodeListPreview__text_area--WMXZz',
        THUMBNAIL: '.Poster__thumbnail_area--gviWY img',
        GENRE_TAG: '.TagGroup__tag--xu0OH',
        AUTHOR_CATEGORY: '.ContentMetaInfo__category--WwrCp'
    };

    /**
     * 웹툰 페이지를 로드하고 필요한 요소들이 로드될 때까지 대기합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @param {string} titleId - 웹툰의 고유 ID
     * @throws {Error} 페이지 로드 실패 시 에러
     */
    async loadPage(page, titleId) {
        try {
            if (this.#currentTitleId === titleId) {
                return;
            }

            await page.goto(this.getWebtoonUrl(titleId), {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            this.#currentTitleId = titleId;

            await Promise.all([
                page.waitForSelector(this.#SELECTORS.TITLE, { timeout: 10000 }),
                page.waitForSelector(this.#SELECTORS.EPISODE_ITEM, { timeout: 10000 }),
                page.waitForSelector(this.#SELECTORS.DESCRIPTION, { timeout: 10000 })
            ]);

            await this.#loadDynamicContent(page);
        } catch (error) {
            throw new Error(`페이지 로드 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰 페이지의 HTML을 추출하고 포맷팅합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 포맷팅된 HTML
     * @throws {Error} HTML 추출 실패 시 에러
     */
    async extractHtml(page) {
        try {
            const html = await page.evaluate(() => {
                const styleElements = document.querySelectorAll('style');
                styleElements.forEach(style => style.remove());
                const doctype = new XMLSerializer().serializeToString(document.doctype);
                return doctype + document.documentElement.outerHTML;
            });
            return await HtmlFormatter.format(html);
        } catch (error) {
            throw new Error(`HTML 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 제목을 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 웹툰 제목
     * @throws {Error} 제목 추출 실패 시 에러
     */
    async scrapTitle(page) {
        try {
            return await page.$eval(
                this.#SELECTORS.TITLE,
                el => el.textContent.trim()
            );
        } catch (error) {
            throw new Error(`제목 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 설명을 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 웹툰 설명
     * @throws {Error} 설명 추출 실패 시 에러
     */
    async scrapDescription(page) {
        try {
            return await page.$eval(
                `${this.#SELECTORS.DESCRIPTION} p`,
                el => el.textContent.trim()
            );
        } catch (error) {
            throw new Error(`설명 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 썸네일 URL을 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 썸네일 URL
     * @throws {Error} 썸네일 URL 추출 실패 시 에러
     */
    async scrapThumbnailUrl(page) {
        try {
            return await page.$eval(
                this.#SELECTORS.THUMBNAIL,
                el => el.getAttribute('src')
            );
        } catch (error) {
            throw new Error(`썸네일 URL 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 연령 등급을 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 연령 등급 (ALL, AGE_12, AGE_15, ADULT)
     * @throws {Error} 연령 등급 추출 실패 시 에러
     */
    async scrapAgeRating(page) {
        try {
            const metaInfo = await page.$(this.#SELECTORS.META_INFO);
            const ageText = await metaInfo.$eval(this.#SELECTORS.META_INFO_ITEM, el => el.textContent.trim());
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
        } catch (error) {
            throw new Error(`연령 등급 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 연재 상태를 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 연재 상태 (ONGOING, COMPLETED, HIATUS)
     * @throws {Error} 연재 상태 추출 실패 시 에러
     */
    async scrapStatus(page) {
        try {
            const metaInfo = await page.$(this.#SELECTORS.META_INFO);
            const statusText = await metaInfo.$eval(this.#SELECTORS.META_INFO_ITEM, el => el.textContent.trim());
            const absenceInfo = await page.$$('.EpisodeListInfo__info_text--MO6kz');
            
            for (const element of absenceInfo) {
                const text = await element.evaluate(el => el.textContent.trim());
                if (text === '휴재') return 'HIATUS';
            }
            
            return statusText.includes('완결') ? 'COMPLETED' : 'ONGOING';
        } catch (error) {
            throw new Error(`연재 상태 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 연재 요일을 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 연재 요일 (월, 화, 수, 목, 금, 토, 일)
     * @throws {Error} 연재 요일 추출 실패 시 에러
     */
    async scrapDayOfWeek(page) {
        try {
            const metaInfo = await page.$(this.#SELECTORS.META_INFO);
            const dayText = await metaInfo.$eval(this.#SELECTORS.META_INFO_ITEM, el => el.textContent.trim());
            const dayMatch = dayText.match(/(월|화|수|목|금|토|일)/);
            return dayMatch ? dayMatch[1] : null;
        } catch (error) {
            throw new Error(`연재 요일 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 장르 정보를 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string[]>} 장르 목록
     * @throws {Error} 장르 정보 추출 실패 시 에러
     */
    async scrapGenres(page) {
        try {
            await this.#expandGenreSection(page);
            const genres = await page.$$eval(
                this.#SELECTORS.GENRE_TAG,
                elements => elements.map(el => el.textContent.trim().replace('#', ''))
            );
            return genres.filter(genre => genre);
        } catch (error) {
            throw new Error(`장르 정보 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 작가 정보를 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<Array<{id: string, name: string, role: string}>>} 작가 정보 목록
     * @throws {Error} 작가 정보 추출 실패 시 에러
     */
    async scrapAuthors(page) {
        try {
            const authors = [];
            await page.waitForSelector(this.#SELECTORS.META_INFO, { timeout: 5000 });
            const authorContainers = await page.$$(this.#SELECTORS.META_INFO);

            for (const container of authorContainers) {
                const categoryElements = await container.$$(this.#SELECTORS.AUTHOR_CATEGORY);
                for (const category of categoryElements) {
                    const authorInfo = await this.#extractAuthorInfo(category);
                    if (authorInfo) {
                        authors.push(authorInfo);
                    }
                }
            }
            return authors;
        } catch (error) {
            throw new Error(`작가 정보 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 총 회차 수를 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<number>} 총 회차 수
     * @throws {Error} 회차 수 추출 실패 시 에러
     */
    async scrapEpisodeCount(page) {
        try {
            const countText = await page.$eval(
                this.#SELECTORS.EPISODE_COUNT,
                el => el.textContent.trim()
            );
            const match = countText.match(/\d+/);
            return match ? parseInt(match[0]) : null;
        } catch (error) {
            throw new Error(`회차 수 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 미리보기 개수를 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<number>} 미리보기 개수
     * @throws {Error} 미리보기 개수 추출 실패 시 에러
     */
    async scrapPreviewCount(page) {
        try {
            await page.waitForSelector(this.#SELECTORS.PREVIEW_AREA, { timeout: 10000 });
            const previewCount = await page.evaluate(() => {
                const element = document.querySelector('.EpisodeListPreview__text_area--WMXZz strong');
                if (!element) return 0;
                const count = parseInt(element.textContent.replace(/[^0-9]/g, ''));
                return isNaN(count) ? 0 : count;
            });
            return previewCount;
        } catch (error) {
            throw new Error(`미리보기 개수 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 최신 무료 회차 정보를 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<{
     *   title: string,
     *   uploadDate: string,
     *   link: string,
     *   episodeNumber: number,
     *   thumbnailUrl: string
     * }>} 최신 무료 회차 정보
     * @throws {Error} 최신 회차 정보 추출 실패 시 에러
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
                const thumbnailElement = firstItem.querySelector('img');

                if (!titleElement || !dateElement || !linkElement) return null;

                const link = linkElement.getAttribute('href');
                const episodeNumber = link ? parseInt(new URLSearchParams(link.split('?')[1]).get('no')) : null;

                return {
                    title: titleElement.textContent.trim(),
                    uploadDate: dateElement.textContent.trim(),
                    link: `https://comic.naver.com${link}`,
                    episodeNumber: episodeNumber,
                    thumbnailUrl: thumbnailElement ? thumbnailElement.getAttribute('src') : null
                };
            });

            if (!latestEpisode) {
                throw new Error('최신 무료 회차 정보를 찾을 수 없습니다.');
            }

            latestEpisode.uploadDate = this.#formatDate(latestEpisode.uploadDate);
            return latestEpisode;
        } catch (error) {
            throw new Error(`최신 무료 회차 정보 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 모든 무료 회차 정보를 수집합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<Array<{
     *   title: string,
     *   uploadDate: string,
     *   link: string,
     *   episodeNumber: number,
     *   thumbnailUrl: string
     * }>>} 무료 회차 정보 목록
     * @throws {Error} 무료 회차 정보 추출 실패 시 에러
     */
    async scrapFreeEpisodes(page) {
        try {
            await page.waitForSelector('.EpisodeListList__episode_list--_N3ks', { timeout: 10000 });
            
            let episodes = [];
            let hasNextPage = true;
            let currentPage = 1;

            while (hasNextPage) {
                const pageEpisodes = await this.#extractEpisodeInfo(page);
                episodes = episodes.concat(pageEpisodes);

                hasNextPage = await this.#moveToNextPage(page, currentPage);
                if (hasNextPage) {
                    currentPage++;
                }
            }

            return episodes;
        } catch (error) {
            throw new Error(`무료 회차 정보 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 고유 ID를 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 웹툰의 고유 ID
     * @throws {Error} 고유 ID 추출 실패 시 에러
     */
    async scrapUniqueId(page) {
        try {
            const url = await page.url();
            const match = url.match(/titleId=(\d+)/);
            return match ? match[1] : null;
        } catch (error) {
            throw new Error(`고유 ID 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 마지막 업데이트 날짜를 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 마지막 업데이트 날짜 (YYYY-MM-DD 형식)
     * @throws {Error} 업데이트 날짜 추출 실패 시 에러
     */
    async scrapLastUpdatedDate(page) {
        try {
            const firstItem = await page.$(this.#SELECTORS.EPISODE_ITEM);
            if (!firstItem) return null;

            const dateText = await firstItem.$eval('.date', el => el.textContent.trim());
            return this.#formatDate(dateText);
        } catch (error) {
            throw new Error(`마지막 업데이트 날짜 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 연재 시작 날짜를 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 연재 시작 날짜 (YYYY-MM-DD 형식)
     * @throws {Error} 연재 시작 날짜 추출 실패 시 에러
     */
    async scrapPublishStartDate(page) {
        try {
            const currentUrl = await page.url();
            await page.goto(`${currentUrl}&page=1&sort=ASC`);

            const firstItem = await page.$(this.#SELECTORS.EPISODE_ITEM);
            if (!firstItem) return null;

            const dateText = await firstItem.$eval('.date', el => el.textContent.trim());
            const formattedDate = this.#formatDate(dateText);

            await page.goto(currentUrl);
            return formattedDate;
        } catch (error) {
            throw new Error(`연재 시작 날짜 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰 URL을 생성합니다.
     * @param {string} titleId - 웹툰의 고유 ID
     * @returns {string} 웹툰 URL
     */
    getWebtoonUrl(titleId) {
        return `https://comic.naver.com/webtoon/list?titleId=${titleId}`;
    }

    /**
     * 동적 컨텐츠를 로드합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @private
     */
    async #loadDynamicContent(page) {
        await page.evaluate(() => {
            window.scrollBy(0, 500);
            return new Promise(resolve => setTimeout(resolve, 1000));
        });
    }

    /**
     * 장르 섹션을 확장합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @private
     */
    async #expandGenreSection(page) {
        try {
            const expandButton = await page.$('.EpisodeListInfo__button_fold--ZKgEw');
            if (expandButton) {
                await expandButton.click();
            }
        } catch (error) {
            console.debug('장르 카테고리 펼치기 버튼이 없거나 클릭할 수 없습니다');
        }
    }

    /**
     * 작가 정보를 추출합니다.
     * @param {import('puppeteer-core').ElementHandle} category - 작가 정보 요소
     * @returns {Promise<{id: string, name: string, role: string}>} 작가 정보
     * @private
     */
    async #extractAuthorInfo(category) {
        try {
            await category.waitForSelector('a', { timeout: 1000 });
            const linkTag = await category.$('a');
            if (!linkTag) return null;

            const href = await linkTag.evaluate(el => el.getAttribute('href'));
            const name = await linkTag.evaluate(el => el.textContent.trim());
            
            const authorId = this.#extractAuthorId(href);
            if (!authorId) return null;

            const fullText = await category.evaluate(el => el.textContent.trim());
            const roleText = this.#extractRoleText(fullText, name);
            const role = this.#mapAuthorRole(roleText);

            return role && authorId && name ? { id: authorId, name, role } : null;
        } catch (error) {
            console.error('작가 정보 추출 중 오류:', error);
            return null;
        }
    }

    /**
     * 작가 ID를 추출합니다.
     * @param {string} href - 작가 링크
     * @returns {string|null} 작가 ID
     * @private
     */
    #extractAuthorId(href) {
        if (href.includes('artistTitle')) {
            const match = href.match(/id=(\d+)/);
            return match ? match[1] : null;
        } else if (href.includes('community')) {
            const match = href.match(/u\/([^?]+)/);
            return match ? match[1] : null;
        }
        console.warn('알 수 없는 구조의 링크:', href);
        return null;
    }

    /**
     * 작가 역할 텍스트를 추출합니다.
     * @param {string} fullText - 전체 텍스트
     * @param {string} name - 작가 이름
     * @returns {string} 역할 텍스트
     * @private
     */
    #extractRoleText(fullText, name) {
        return fullText.split(/\s+/)
            .filter(part => part !== name)
            .join('');
    }

    /**
     * 작가 역할을 매핑합니다.
     * @param {string} roleText - 역할 텍스트
     * @returns {string|null} 매핑된 역할
     * @private
     */
    #mapAuthorRole(roleText) {
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

        for (const [key, value] of Object.entries(combinedRoleMap)) {
            if (roleText.includes(key)) return value;
        }

        for (const [key, value] of Object.entries(singleRoleMap)) {
            if (roleText.includes(key)) return value;
        }

        return null;
    }

    /**
     * 에피소드 정보를 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<Array>} 에피소드 정보 목록
     * @private
     */
    async #extractEpisodeInfo(page) {
        const episodes = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.EpisodeListList__item--M8zq4')).map(item => {
                const titleElement = item.querySelector('.EpisodeListList__title--lfIzU');
                const dateElement = item.querySelector('.date');
                const linkElement = item.querySelector('a');
                const thumbnailElement = item.querySelector('img');

                if (!titleElement || !dateElement || !linkElement) return null;

                const link = linkElement.getAttribute('href');
                const episodeNumber = link ? parseInt(new URLSearchParams(link.split('?')[1]).get('no')) : null;

                return {
                    title: titleElement.textContent.trim(),
                    uploadDate: dateElement.textContent.trim(),
                    link: `https://comic.naver.com${link}`,
                    episodeNumber: episodeNumber,
                    thumbnailUrl: thumbnailElement ? thumbnailElement.getAttribute('src') : null
                };
            }).filter(episode => episode !== null);
        });

        episodes.forEach(episode => {
            episode.uploadDate = this.#formatDate(episode.uploadDate);
        });

        return episodes;
    }

    /**
     * 다음 페이지로 이동합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @param {number} currentPage - 현재 페이지 번호
     * @returns {Promise<boolean>} 다음 페이지 존재 여부
     * @private
     */
    async #moveToNextPage(page, currentPage) {
        const nextPageButton = await page.$('a.page_next');
        if (!nextPageButton) return false;

        const isDisabled = await page.evaluate(button => {
            return button.classList.contains('disabled') || button.getAttribute('aria-disabled') === 'true';
        }, nextPageButton);

        if (!isDisabled) {
            await page.goto(`${page.url().split('&page=')[0]}&page=${currentPage + 1}`);
            await page.waitForSelector('.EpisodeListList__episode_list--_N3ks', { timeout: 10000 });
            return true;
        }

        return false;
    }

    /**
     * 날짜 문자열을 포맷팅합니다.
     * @param {string} dateStr - YY.MM.DD 형식의 날짜 문자열
     * @returns {string} YYYY-MM-DD 형식의 날짜 문자열
     * @private
     */
    #formatDate(dateStr) {
        const [year, month, day] = dateStr.split('.');
        return `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    /**
     * 웹툰의 유료 회차 정보를 수집합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<Array<{
     *   title: string,
     *   uploadDate: string | null,
     *   daysUntilFree: number | null,
     *   link: string,
     *   episodeNumber: number,
     *   thumbnailUrl: string
     * }>>} 유료 회차 정보 목록
     * @throws {Error} 유료 회차 정보 추출 실패 시 에러
     */
    async scrapPaidEpisodes(page) {
        try {
            // 총 에피소드 수 가져오기
            const totalEpisodes = await this.scrapEpisodeCount(page);
            if (!totalEpisodes) {
                throw new Error('총 에피소드 수를 가져올 수 없습니다.');
            }

            // 미리보기 버튼 찾기 및 클릭
            const previewButton = await page.$('.EpisodeListPreview__button_preview--IBGaa');
            if (!previewButton) {
                return [];
            }

            await previewButton.click();
            await page.waitForSelector('.EpisodeListList__episode_list--_N3ks', { timeout: 5000 });

            // 유료 회차 목록 추출
            const rawEpisodes = await page.evaluate(() => {
                const paidItems = Array.from(document.querySelectorAll('li.EpisodeListList__item--M8zq4.EpisodeListList__bm--HDC0X'));
                return paidItems.map(item => {
                    const titleElement = item.querySelector('.EpisodeListList__title--lfIzU');
                    const dateElement = item.querySelector('.date');
                    const linkElement = item.querySelector('a');
                    const thumbnailElement = item.querySelector('img');

                    if (!titleElement || !dateElement || !linkElement) return null;

                    const link = linkElement.getAttribute('href');
                    const dateText = dateElement.textContent.trim();
                    
                    // "X일 후 무료" 형식 처리
                    const daysMatch = dateText.match(/(\d+)일 후 무료/);
                    const daysUntilFree = daysMatch ? parseInt(daysMatch[1]) : null;

                    return {
                        title: titleElement.textContent.trim(),
                        dateText: dateText,
                        daysUntilFree: daysUntilFree,
                        link: `https://comic.naver.com${link}`,
                        thumbnailUrl: thumbnailElement ? thumbnailElement.getAttribute('src') : null
                    };
                }).filter(episode => episode !== null);
            });

            // 날짜 정보 처리 및 에피소드 번호 부여
            return rawEpisodes.map((episode, index) => {
                const { dateText, daysUntilFree, ...rest } = episode;
                
                // 실제 날짜가 있는 경우 (과거 유료 회차가 무료로 전환된 경우)
                const dateMatch = dateText.match(/\d{2}\.\d{2}\.\d{2}/);
                const uploadDate = dateMatch ? this.#formatDate(dateText) : null;

                // 최신화부터 내림차순으로 번호 부여
                const episodeNumber = totalEpisodes - index;

                return {
                    ...rest,
                    uploadDate,
                    daysUntilFree,
                    episodeNumber
                };
            });
        } catch (error) {
            throw new Error(`유료 회차 정보 추출 실패: ${error.message}`);
        }
    }
} 