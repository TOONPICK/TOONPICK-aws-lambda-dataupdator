import { ScrapingImplementor } from './scrapingImplementor.js';

/**
 * 네이버 웹툰 스크래핑을 구현하는 클래스입니다.
 * @extends ScrapingImplementor
 */
export class NaverScraper extends ScrapingImplementor {
    #SELECTORS = {
        // 기본 정보
        TITLE: '.EpisodeListInfo__title--mYLjC',
        DESCRIPTION: '.EpisodeListInfo__summary_wrap--ZWNW5',
        DESCRIPTION_TEXT: '.EpisodeListInfo__summary_wrap--ZWNW5 p',
        THUMBNAIL: '.Poster__thumbnail_area--gviWY img',
        
        // 메타 정보
        META_INFO: '.ContentMetaInfo__meta_info--GbTg4',
        META_INFO_ITEM: '.ContentMetaInfo__info_item--utGrf',
        AUTHOR_CATEGORY: '.ContentMetaInfo__category--WwrCp',
        
        // 에피소드 관련
        EPISODE_LIST: '.EpisodeListList__episode_list--_N3ks',
        EPISODE_ITEM: '.EpisodeListList__item--M8zq4',
        EPISODE_PAID_ITEM: '.EpisodeListList__item--M8zq4.EpisodeListList__bm--HDC0X',
        EPISODE_TITLE: '.EpisodeListList__title--lfIzU',
        EPISODE_DATE: '.date',
        EPISODE_COUNT: '.EpisodeListView__count--fTMc5',
        
        // 미리보기 관련
        PREVIEW_AREA: '.EpisodeListPreview__text_area--WMXZz',
        PREVIEW_BUTTON: '.EpisodeListPreview__button_preview--IBGaa',
        PREVIEW_COUNT: '.EpisodeListPreview__text_area--WMXZz strong',
        
        // 관련 상품 정보
        PRODUCT_LIST: '.AsideProductList__product_list--yMw4n',
        PRODUCT_ITEM: '.AsideProductList__item--riayO',
        PRODUCT_LINK: '.Poster__link--sopnC',
        PRODUCT_TITLE: '.AsideProductList__title--TXUE9',
        PRODUCT_THUMBNAIL: '.Poster__image--d9XTI',
        PRODUCT_INFO: '.AsideProductList__price--UYuzI',
        
        // 기타
        GENRE_TAG: '.TagGroup__tag--xu0OH',
        GENRE_EXPAND_BUTTON: '.EpisodeListInfo__button_fold--ZKgEw',
        HIATUS_INFO: '.EpisodeListInfo__info_text--MO6kz',
        
        // 연관 웹툰 관련
        RELATED_WEBTOONS: '.AsideList__content_list--FXDvm',
        RELATED_WEBTOON_ITEM: '.AsideList__item--i30ly',
        RELATED_WEBTOON_LINK: '.Poster__link--sopnC',
    };

    /**
     * 웹툰 페이지를 로드하고 필요한 요소들이 로드될 때까지 대기합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @param {string} url - 웹툰의 링크(URL)
     * @throws {Error} 페이지 로드 실패 시 에러
     */
    async loadPage(page, url) {
        try {
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: this.getTimeout('PAGE_LOAD')
            });

            // 병렬로 여러 요소 대기 (타임아웃 단축)
            await Promise.all([
                page.waitForSelector(this.#SELECTORS.TITLE, { timeout: this.getTimeout('SELECTOR_WAIT') }),
                page.waitForSelector(this.#SELECTORS.EPISODE_ITEM, { timeout: this.getTimeout('SELECTOR_WAIT') }),
                page.waitForSelector(this.#SELECTORS.DESCRIPTION, { timeout: this.getTimeout('SELECTOR_WAIT') })
            ]);

            // 동적 컨텐츠 로드 시간 단축
            await this.#loadDynamicContent(page);
        } catch (error) {
            throw new Error(`페이지 로드 실패: ${error.message}`);
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
     * 웹툰의 URL을 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 웹툰 URL
     * @throws {Error} URL 추출 실패 시 에러
     */
    async scrapUrl(page) {
        try {
            return page.url();
        } catch (error) {
            throw new Error(`URL 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 모바일 URL을 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string>} 웹툰 모바일 URL
     * @throws {Error} 모바일 URL 추출 실패 시 에러
     */
    async scrapMobileUrl(page) {
        try {
            const currentUrl = page.url();
            // 네이버 웹툰의 경우 모바일 URL은 m.com.naver.com으로 변경
            return currentUrl.replace('comic.naver.com', 'm.com.naver.com');
        } catch (error) {
            throw new Error(`모바일 URL 추출 실패: ${error.message}`);
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
            const absenceInfo = await page.$$(this.#SELECTORS.HIATUS_INFO);
            
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
            await page.waitForSelector(this.#SELECTORS.META_INFO, { timeout: this.getTimeout('SELECTOR_WAIT') });
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
     * @param {import('puppeteer-core').Page} page
     * @returns {Promise<number>} 총 회차 수
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
     * 최신 무료 회차 N개를 수집합니다.
     */
    async scrapLatestFreeEpisodes(page, count = 1) {
        try {
            await page.waitForSelector(this.#SELECTORS.EPISODE_LIST, { timeout: this.getTimeout('NAVIGATION_WAIT') });
            
            let collectedEpisodes = [];
            let currentPage = 1;
            let hasMorePages = true;
            let consecutiveFailures = 0;
            const maxFailures = 2;
            
            console.log(`최신 ${count}개 무료 회차 수집 시작`);
            
            while (hasMorePages && collectedEpisodes.length < count && consecutiveFailures < maxFailures) {
                try {
                    // 현재 페이지의 무료 에피소드 수집
                    const pageEpisodes = await this.#extractFreeEpisodeInfo(page);
                    collectedEpisodes = collectedEpisodes.concat(pageEpisodes);
                    consecutiveFailures = 0; // 성공 시 실패 카운트 리셋
                    
                    console.log(`페이지 ${currentPage}: ${pageEpisodes.length}개 에피소드 수집, 총 ${collectedEpisodes.length}개`);
                    
                    // 요청된 개수만큼 수집했으면 종료
                    if (collectedEpisodes.length >= count) {
                        break;
                    }
                    
                    // 다음 페이지로 이동 시도
                    hasMorePages = await this.#moveToNextPage(page, currentPage);
                    if (hasMorePages) {
                        currentPage++;
                    }
                } catch (error) {
                    consecutiveFailures++;
                    console.error(`페이지 ${currentPage} 처리 중 오류:`, error.message);
                    
                    if (consecutiveFailures >= maxFailures) {
                        console.error(`연속 ${maxFailures}번 실패로 수집 중단`);
                        break;
                    }
                    
                    // 잠시 대기 후 재시도 (2000ms → 500ms)
                    await page.waitForTimeout(this.getTimeout('ERROR_RECOVERY'));
                }
            }
            
            // 중복 제거 후 요청된 개수만큼 반환
            const uniqueEpisodes = this.#removeDuplicateEpisodes(collectedEpisodes);
            const result = uniqueEpisodes.slice(0, count);
            
            console.log(`최신 무료 회차 수집 완료: ${result.length}/${count}개`);
            return result;
        } catch (error) {
            throw new Error(`최신 무료 회차 N개 추출 실패: ${error.message}`);
        }
    }

    /**
     * 최신 유료 회차 N개를 수집합니다.
     */
    async scrapLatestPaidEpisodes(page, count = 1) {
        try {
            const totalEpisodes = await this.scrapEpisodeCount(page);
            if (!totalEpisodes) {
                throw new Error('총 에피소드 수를 가져올 수 없습니다.');
            }
            
            const previewButton = await page.$(this.#SELECTORS.PREVIEW_BUTTON);
            if (!previewButton) {
                return [];
            }
            
            await previewButton.click();
            await page.waitForSelector(this.#SELECTORS.EPISODE_LIST, { timeout: this.getTimeout('NAVIGATION_WAIT') });
            
            let collectedEpisodes = [];
            let currentPage = 1;
            let hasMorePages = true;
            let consecutiveFailures = 0;
            const maxFailures = 2;
            
            console.log(`최신 ${count}개 유료 회차 수집 시작`);
            
            while (hasMorePages && collectedEpisodes.length < count && consecutiveFailures < maxFailures) {
                try {
                    // 현재 페이지의 유료 에피소드 수집
                    const pageEpisodes = await this.#extractPaidEpisodeInfo(page, totalEpisodes);
                    collectedEpisodes = collectedEpisodes.concat(pageEpisodes);
                    consecutiveFailures = 0; // 성공 시 실패 카운트 리셋
                    
                    console.log(`페이지 ${currentPage}: ${pageEpisodes.length}개 유료 에피소드 수집, 총 ${collectedEpisodes.length}개`);
                    
                    // 요청된 개수만큼 수집했으면 종료
                    if (collectedEpisodes.length >= count) {
                        break;
                    }
                    
                    // 다음 페이지로 이동 시도
                    hasMorePages = await this.#moveToNextPage(page, currentPage);
                    if (hasMorePages) {
                        currentPage++;
                    }
                } catch (error) {
                    consecutiveFailures++;
                    console.error(`페이지 ${currentPage} 처리 중 오류:`, error.message);
                    
                    if (consecutiveFailures >= maxFailures) {
                        console.error(`연속 ${maxFailures}번 실패로 수집 중단`);
                        break;
                    }
                    
                    // 잠시 대기 후 재시도 (2000ms → 500ms)
                    await page.waitForTimeout(this.getTimeout('ERROR_RECOVERY'));
                }
            }
            
            // 중복 제거 후 요청된 개수만큼 반환
            const uniqueEpisodes = this.#removeDuplicateEpisodes(collectedEpisodes);
            const result = uniqueEpisodes.slice(0, count);
            
            console.log(`최신 유료 회차 수집 완료: ${result.length}/${count}개`);
            return result;
        } catch (error) {
            throw new Error(`최신 유료 회차 N개 추출 실패: ${error.message}`);
        }
    }

    /**
     * 모든 무료 회차 정보를 수집합니다.
     */
    async scrapFreeEpisodes(page) {
        try {
            await page.waitForSelector(this.#SELECTORS.EPISODE_LIST, { timeout: this.getTimeout('NAVIGATION_WAIT') });
            
            // 총 회차 수와 미리보기(유료) 회차 수를 가져와서 무료 회차 수 계산
            const [totalEpisodes, previewCount] = await Promise.all([
                this.scrapEpisodeCount(page),
                this.scrapPreviewCount(page)
            ]);
            
            const totalFreeEpisodes = totalEpisodes - previewCount;
            let collectedEpisodes = [];
            let currentPage = 1;
            let hasMorePages = true;
            let consecutiveFailures = 0;
            const maxFailures = 3;
            
            console.log(`총 ${totalFreeEpisodes}개 무료 회차 수집 시작`);
            
            while (hasMorePages && collectedEpisodes.length < totalFreeEpisodes && consecutiveFailures < maxFailures) {
                try {
                    // 현재 페이지의 무료 에피소드 수집
                    const pageEpisodes = await this.#extractFreeEpisodeInfo(page);
                    collectedEpisodes = collectedEpisodes.concat(pageEpisodes);
                    consecutiveFailures = 0; // 성공 시 실패 카운트 리셋
                    
                    console.log(`페이지 ${currentPage}: ${pageEpisodes.length}개 에피소드 수집, 총 ${collectedEpisodes.length}개`);
                    
                    // 다음 페이지로 이동 시도
                    hasMorePages = await this.#moveToNextPage(page, currentPage);
                    if (hasMorePages) {
                        currentPage++;
                    }
                } catch (error) {
                    consecutiveFailures++;
                    console.error(`페이지 ${currentPage} 처리 중 오류:`, error.message);
                    
                    if (consecutiveFailures >= maxFailures) {
                        console.error(`연속 ${maxFailures}번 실패로 수집 중단`);
                        break;
                    }
                    
                    // 잠시 대기 후 재시도 (2000ms → 500ms)
                    await page.waitForTimeout(this.getTimeout('ERROR_RECOVERY'));
                }
            }
            
            // 총 무료 회차 수만큼만 반환 (중복 제거 및 정렬)
            const uniqueEpisodes = this.#removeDuplicateEpisodes(collectedEpisodes);
            const result = uniqueEpisodes.slice(0, totalFreeEpisodes);
            
            console.log(`무료 회차 수집 완료: ${result.length}/${totalFreeEpisodes}개`);
            return result;
        } catch (error) {
            throw new Error(`무료 회차 정보 추출 실패: ${error.message}`);
        }
    }

    /**
     * 모든 유료 회차 정보를 수집합니다.
     */
    async scrapPaidEpisodes(page) {
        try {
            const totalEpisodes = await this.scrapEpisodeCount(page);
            if (!totalEpisodes) {
                throw new Error('총 에피소드 수를 가져올 수 없습니다.');
            }
            const previewButton = await page.$(this.#SELECTORS.PREVIEW_BUTTON);
            if (!previewButton) {
                return [];
            }
            await previewButton.click();
            await page.waitForSelector(this.#SELECTORS.EPISODE_LIST, { timeout: this.getTimeout('NAVIGATION_WAIT') });
            return await this.#extractPaidEpisodeInfo(page, totalEpisodes);
        } catch (error) {
            throw new Error(`유료 회차 정보 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 미리보기 개수를 추출합니다.
     */
    async scrapPreviewCount(page) {
        try {
            await page.waitForSelector(this.#SELECTORS.PREVIEW_AREA, { timeout: this.getTimeout('NAVIGATION_WAIT') });
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
     * @returns {Promise<string|null>} 마지막 업데이트 날짜 (YYYY-MM-DD 형식)
     * @throws {Error} 업데이트 날짜 추출 실패 시 에러
     */
    async scrapLastUpdatedDate(page) {
        try {
            await page.waitForSelector(this.#SELECTORS.EPISODE_ITEM, { timeout: this.getTimeout('NAVIGATION_WAIT') });
            const firstItem = await page.$(this.#SELECTORS.EPISODE_ITEM);
            if (!firstItem) {
                return null;
            }

            const dateText = await firstItem.$eval(this.#SELECTORS.EPISODE_DATE, el => el.textContent.trim());
            if (!dateText) {
                return null;
            }

            // YY.MM.DD 형식의 날짜만 처리
            const dateMatch = dateText.match(/\d{2}\.\d{2}\.\d{2}/);
            if (!dateMatch) {
                return null;
            }

            return this.#formatDate(dateMatch[0]);
        } catch (error) {
            throw new Error(`마지막 업데이트 날짜 추출 실패: ${error.message}`);
        }
    }

    /**
     * 웹툰의 연재 시작 날짜를 추출합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<string|null>} 연재 시작 날짜 (YYYY-MM-DD 형식)
     * @throws {Error} 연재 시작 날짜 추출 실패 시 에러
     */
    async scrapPublishStartDate(page) {
        try {
            // 현재 URL에서 titleId 추출
            const currentUrl = page.url();
            const urlObj = new URL(currentUrl);
            const titleId = urlObj.searchParams.get('titleId');
            
            if (!titleId) {
                console.debug('titleId를 찾을 수 없습니다.');
                return null;
            }

            // 첫 화 페이지 URL 생성 (ASC 정렬로 첫 번째 에피소드)
            const firstPageUrl = `https://comic.naver.com/webtoon/list?titleId=${titleId}&page=1&sort=ASC`;
            
            console.log(`연재 시작일 수집을 위해 첫 화 페이지로 이동: ${firstPageUrl}`);
            
            // 첫 화 페이지로 이동
            await page.goto(firstPageUrl, { 
                waitUntil: 'domcontentloaded', 
                timeout: this.getTimeout('NAVIGATION_WAIT') 
            });
            
            // 페이지 로드 대기
            await page.waitForSelector(this.#SELECTORS.EPISODE_ITEM, { timeout: this.getTimeout('SELECTOR_WAIT') });
            
            // 첫 번째 에피소드 찾기
            const firstItem = await page.$(this.#SELECTORS.EPISODE_ITEM);
            if (!firstItem) {
                console.debug('첫 화 정보를 찾을 수 없습니다.');
                return null;
            }

            // 첫 번째 에피소드의 날짜 추출
            const dateText = await firstItem.$eval(this.#SELECTORS.EPISODE_DATE, el => el.textContent.trim());
            if (!dateText) {
                console.debug('첫 화 날짜 정보를 찾을 수 없습니다.');
                return null;
            }

            // YY.MM.DD 형식의 날짜만 처리
            const dateMatch = dateText.match(/\d{2}\.\d{2}\.\d{2}/);
            if (!dateMatch) {
                console.debug(`날짜 형식이 올바르지 않습니다: ${dateText}`);
                return null;
            }

            const formattedDate = this.#formatDate(dateMatch[0]);
            console.log(`연재 시작일 추출 완료: ${formattedDate}`);
            
            return formattedDate;
            
        } catch (error) {
            console.error(`연재 시작 날짜 추출 실패: ${error.message}`);
            return null;
        }
    }

    /**
     * 웹툰 URL을 생성합니다.
     * @param {string} titleId - 웹툰의 고유 ID
     * @returns {string} 웹툰 URL
     */
    #getWebtoonUrl(titleId) {
        return `https://comic.naver.com/webtoon/list?titleId=${titleId}`;
    }

    /**
     * 동적 컨텐츠를 로드합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @private
     */
    async #loadDynamicContent(page) {
        await page.evaluate((timeout) => {
            window.scrollBy(0, 500);
            return new Promise(resolve => setTimeout(resolve, timeout));
        }, this.getTimeout('DYNAMIC_CONTENT'));
    }

    /**
     * 장르 섹션을 확장합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @private
     */
    async #expandGenreSection(page) {
        try {
            const expandButton = await page.$(this.#SELECTORS.GENRE_EXPAND_BUTTON);
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
     * 다음 페이지로 이동합니다.
     * @param {import('puppeteer-core').Page} page
     * @param {number} currentPage
     * @returns {Promise<boolean>}
     * @private
     */
    async #moveToNextPage(page, currentPage) {
        try {
            // 현재 URL에서 titleId 추출
            const currentUrl = page.url();
            const urlObj = new URL(currentUrl);
            const titleId = urlObj.searchParams.get('titleId');
            
            if (!titleId) return false;

            // 다음 페이지 URL 생성
            const nextPageUrl = `https://comic.naver.com/webtoon/list?titleId=${titleId}&page=${currentPage + 1}&sort=DESC`;
            
            console.log(`페이지 ${currentPage + 1}로 이동 시도: ${nextPageUrl}`);
            
            // 페이지 이동 전에 짧은 대기 (1000ms → 300ms)
            await page.waitForTimeout(this.getTimeout('BEFORE_NAVIGATION'));
            
            // 다음 페이지로 이동 (더 빠른 옵션 사용)
            await page.goto(nextPageUrl, { 
                waitUntil: 'domcontentloaded', 
                timeout: this.getTimeout('NAVIGATION_WAIT') 
            });
            
            // 페이지 로드 후 짧은 대기 (2000ms → 500ms)
            await page.waitForTimeout(this.getTimeout('AFTER_NAVIGATION'));
            
            // 페이지 로드 확인
            try {
                await page.waitForSelector(this.#SELECTORS.EPISODE_LIST, { timeout: this.getTimeout('SELECTOR_WAIT') });
            } catch (error) {
                console.debug(`페이지 ${currentPage + 1}에서 에피소드 리스트를 찾을 수 없습니다.`);
                return false;
            }
            
            // 실제로 에피소드가 있는지 확인 (빈 페이지인지 체크)
            const episodeItems = await page.$$(this.#SELECTORS.EPISODE_ITEM);
            if (episodeItems.length === 0) {
                console.debug(`페이지 ${currentPage + 1}에 에피소드가 없습니다.`);
                return false;
            }
            
            console.log(`페이지 ${currentPage + 1} 이동 성공, ${episodeItems.length}개 에피소드 발견`);
            return true;
            
        } catch (error) {
            console.debug(`다음 페이지 이동 실패 (페이지 ${currentPage + 1}):`, error.message);
            
            // 페이지가 여전히 유효한지 확인
            try {
                await page.waitForTimeout(this.getTimeout('ERROR_RECOVERY'));
                const currentUrl = page.url();
                console.debug(`현재 페이지 URL: ${currentUrl}`);
            } catch (navError) {
                console.debug(`페이지 상태 확인 실패:`, navError.message);
            }
            
            return false;
        }
    }

    /**
     * 중복된 에피소드를 제거합니다.
     * @param {Array} episodes - 에피소드 배열
     * @returns {Array} 중복이 제거된 에피소드 배열
     * @private
     */
    #removeDuplicateEpisodes(episodes) {
        const seen = new Set();
        return episodes.filter(episode => {
            if (episode.episodeNumber && seen.has(episode.episodeNumber)) {
                return false;
            }
            if (episode.episodeNumber) {
                seen.add(episode.episodeNumber);
            }
            return true;
        });
    }

    /**
     * 날짜 문자열을 포맷팅합니다.
     * @param {string} dateStr - YY.MM.DD 형식의 날짜 문자열
     * @returns {string} YYYY-MM-DD 형식의 날짜 문자열
     * @private
     */
    #formatDate(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') {
            throw new Error('유효하지 않은 날짜 형식입니다.');
        }

        const dateMatch = dateStr.match(/(\d{2})\.(\d{2})\.(\d{2})/);
        if (!dateMatch) {
            throw new Error('날짜 형식이 YY.MM.DD와 일치하지 않습니다.');
        }

        const [, year, month, day] = dateMatch;
        return `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    /**
     * 웹툰의 관련 웹소설 정보를 스크래핑합니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<import('../types/webtoon.js').Novel[]|null>} 관련 웹소설 정보 목록
     */
    async scrapRelatedNovels(page) {
        try {
            const exists = await page.$(this.#SELECTORS.PRODUCT_LIST);
            if (!exists) return null;
            await page.waitForSelector(this.#SELECTORS.PRODUCT_LIST, { timeout: this.getTimeout('SELECTOR_WAIT') });

            return await page.evaluate(
                (selectors) => {
                    const novels = [];
                    const items = document.querySelectorAll(selectors.PRODUCT_ITEM);

                    for (const item of items) {
                        const linkElement = item.querySelector(selectors.PRODUCT_LINK);
                        const titleElement = item.querySelector(selectors.PRODUCT_TITLE);
                        const thumbnailElement = item.querySelector(selectors.PRODUCT_THUMBNAIL);
                        const infoElement = item.querySelector(selectors.PRODUCT_INFO);

                        // 펀딩 상품 제외
                        if (infoElement?.textContent.includes('펀딩')) {
                            continue;
                        }

                        // 웹소설 관련 상품만 포함
                        if (!titleElement?.textContent.toLowerCase().includes('웹소설')) {
                            continue;
                        }

                        const title = titleElement.textContent.trim()
                            .replace(/웹소설\s+/, '')
                            .replace(/[<>]/g, '')
                            .trim();
                        
                        const link = linkElement?.getAttribute('href');
                        const thumbnailUrl = thumbnailElement?.getAttribute('src');
                        
                        // 상품 타입 결정 (단행본 여부)
                        const type = title.includes('[단행본]') ? 'BOOK' : 'ORIGINAL';
                        
                        // 무료 회차 수 추출
                        let freeEpisodeCount = null;
                        const infoText = infoElement?.textContent.trim();
                        if (infoText) {
                            const match = infoText.match(/(\d+)화 무료/);
                            if (match) {
                                freeEpisodeCount = parseInt(match[1]);
                            }
                        }

                        if (title && link && thumbnailUrl) {
                            novels.push({
                                title,
                                link,
                                thumbnailUrl,
                                type,
                                ...(freeEpisodeCount !== null && { freeEpisodeCount })
                            });
                        }
                    }

                    return novels;
                },
                this.#SELECTORS
            );
        } catch (error) {
            // PRODUCT_LIST 셀렉터가 없으면 null 반환
            if (error.message && error.message.includes('waiting for selector')) {
                return null;
            }
            throw new Error(`관련 웹소설 정보 추출 실패: ${error.message}`);
        }
    }

    /**
     * 연관된 웹툰들의 ID를 스크래핑합니다.
     * @param {import('puppeteer-core').Page} page
     * @returns {Promise<string[]|null>}
     * @throws {Error}
     */
    async scrapRelatedWebtoonIds(page) {
        try {
            const exists = await page.$(this.#SELECTORS.RELATED_WEBTOONS);
            if (!exists) return null;
            await page.waitForSelector(this.#SELECTORS.RELATED_WEBTOONS, { timeout: this.getTimeout('SELECTOR_WAIT') });

            return await page.evaluate((selectors) => {
                const relatedWebtoons = document.querySelectorAll(selectors.RELATED_WEBTOON_ITEM);
                const ids = [];

                for (const webtoon of relatedWebtoons) {
                    const link = webtoon.querySelector(selectors.RELATED_WEBTOON_LINK)?.getAttribute('href');
                    if (link) {
                        const match = link.match(/titleId=(\d+)/);
                        if (match) {
                            ids.push(match[1]);
                        }
                    }
                }

                return ids;
            }, this.#SELECTORS);
        } catch (error) {
            // AsideList__content_list--FXDvm 셀렉터가 없으면 null 반환
            if (error.message && error.message.includes('waiting for selector')) {
                return null;
            }
            throw new Error(`연관 웹툰 ID 추출 실패: ${error.message}`);
        }
    }

    /**
     * 무료 에피소드 정보를 추출하는 함수입니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @returns {Promise<Array>} 에피소드 정보 목록
     * @private
     */
    async #extractFreeEpisodeInfo(page) {
        const episodes = await page.evaluate(
            ({ episodeItemSelector, episodeTitleSelector, episodeDateSelector }) => {
                const items = Array.from(document.querySelectorAll(episodeItemSelector));
                return items.map(item => {
                    const titleElement = item.querySelector(episodeTitleSelector);
                    const dateElement = item.querySelector(episodeDateSelector);
                    const linkElement = item.querySelector('a');
                    const thumbnailElement = item.querySelector('img');

                    if (!titleElement || !dateElement || !linkElement) return null;

                    const link = linkElement.getAttribute('href');
                    const episodeNumber = link ? parseInt(new URLSearchParams(link.split('?')[1]).get('no')) : null;
                    const dateText = dateElement.textContent.trim();

                    // URL에서 week 파라미터 제거
                    let cleanLink = `https://comic.naver.com${link}`;
                    try {
                        const url = new URL(cleanLink);
                        url.searchParams.delete('week');
                        cleanLink = url.toString();
                    } catch (error) {
                        // URL 파싱 실패 시 원본 링크 사용
                    }

                    return {
                        title: titleElement.textContent.trim(),
                        dateText: dateText,
                        link: cleanLink,
                        episodeNumber: episodeNumber,
                        thumbnailUrl: thumbnailElement ? thumbnailElement.getAttribute('src') : null
                    };
                }).filter(episode => episode !== null);
            },
            {
                episodeItemSelector: this.#SELECTORS.EPISODE_ITEM,
                episodeTitleSelector: this.#SELECTORS.EPISODE_TITLE,
                episodeDateSelector: this.#SELECTORS.EPISODE_DATE
            }
        );

        return episodes.map(episode => {
            const { dateText, ...rest } = episode;
            const dateMatch = dateText.match(/\d{2}\.\d{2}\.\d{2}/);
            const uploadDate = dateMatch ? this.#formatDate(dateText) : null;

            // 모바일 URL 생성
            let mobileUrl = null;
            try {
                if (episode.link && episode.episodeNumber) {
                    const titleId = episode.link.match(/titleId=(\d+)/)?.[1];
                    if (titleId) {
                        mobileUrl = `https://m.comic.naver.com/external/appLaunchBridge?type=ARTICLE_DETAIL&titleId=${titleId}&no=${episode.episodeNumber}`;
                    }
                }
            } catch (error) {
                // 모바일 URL 생성 실패 시 null 유지
            }

            return {
                ...rest,
                uploadDate,
                mobileUrl,
                pricingType: 'FREE'
            };
        });
    }

    /**
     * 유료 에피소드 정보를 추출하는 함수입니다.
     * @param {import('puppeteer-core').Page} page - Puppeteer 페이지 인스턴스
     * @param {number} totalEpisodes - 총 에피소드 수
     * @returns {Promise<Array>} 에피소드 정보 목록
     * @private
     */
    async #extractPaidEpisodeInfo(page, totalEpisodes) {
        const episodes = await page.evaluate(
            ({ episodePaidItemSelector, episodeTitleSelector, episodeDateSelector }) => {
                const items = Array.from(document.querySelectorAll(episodePaidItemSelector));
                return items.map(item => {
                    const titleElement = item.querySelector(episodeTitleSelector);
                    const dateElement = item.querySelector(episodeDateSelector);
                    const linkElement = item.querySelector('a');
                    const thumbnailElement = item.querySelector('img');

                    if (!titleElement || !dateElement || !linkElement) return null;

                    const link = linkElement.getAttribute('href');
                    const dateText = dateElement.textContent.trim();

                    // URL에서 week 파라미터 제거
                    let cleanLink = `https://comic.naver.com${link}`;
                    try {
                        const url = new URL(cleanLink);
                        url.searchParams.delete('week');
                        cleanLink = url.toString();
                    } catch (error) {
                        // URL 파싱 실패 시 원본 링크 사용
                    }

                    return {
                        title: titleElement.textContent.trim(),
                        dateText: dateText,
                        link: cleanLink,
                        thumbnailUrl: thumbnailElement ? thumbnailElement.getAttribute('src') : null
                    };
                }).filter(episode => episode !== null);
            },
            {
                episodePaidItemSelector: this.#SELECTORS.EPISODE_PAID_ITEM,
                episodeTitleSelector: this.#SELECTORS.EPISODE_TITLE,
                episodeDateSelector: this.#SELECTORS.EPISODE_DATE
            }
        );

        return episodes.map((episode, index) => {
            const { dateText, ...rest } = episode;
            
            // "X일 후 무료" 형식 처리
            const daysMatch = dateText.match(/(\d+)일 후 무료/);
            const daysUntilFree = daysMatch ? parseInt(daysMatch[1]) : null;

            // 실제 날짜가 있는 경우 (과거 유료 회차가 무료로 전환된 경우)
            const dateMatch = dateText.match(/\d{2}\.\d{2}\.\d{2}/);
            const uploadDate = dateMatch ? this.#formatDate(dateText) : null;

            // 최신화부터 내림차순으로 번호 부여
            const episodeNumber = totalEpisodes - index;

            // 모바일 URL 생성
            let mobileUrl = null;
            try {
                if (episode.link && episodeNumber) {
                    const titleId = episode.link.match(/titleId=(\d+)/)?.[1];
                    if (titleId) {
                        mobileUrl = `https://m.comic.naver.com/external/appLaunchBridge?type=ARTICLE_DETAIL&titleId=${titleId}&no=${episodeNumber}`;
                    }
                }
            } catch (error) {
                // 모바일 URL 생성 실패 시 null 유지
            }

            return {
                ...rest,
                uploadDate,
                daysUntilFree,
                episodeNumber,
                mobileUrl,
                pricingType: 'PAID'
            };
        });
    }

    /**
     * 신작 웹툰 리스트를 수집한다.
     * @param {import('puppeteer-core').Browser} browser - Puppeteer 브라우저 인스턴스
     * @returns {Promise<import('../types/webtoon.js').NewWebtoonInfo[]>} 신작 웹툰 리스트
     */
    async scrapNewWebtoonList(browser) {
        const NAVER_NEW_WEBTOON_URL = 'https://comic.naver.com/webtoon?tab=new';
        const PLATFORM = 'NAVER';
        const page = await browser.newPage();
        await page.goto(NAVER_NEW_WEBTOON_URL, { waitUntil: 'domcontentloaded', timeout: this.getTimeout('PAGE_LOAD') });
        await page.waitForSelector('ul.ContentList__content_list--q5KXY');

        const newWebtoonList = await page.evaluate(() => {
            const result = [];
            const items = document.querySelectorAll('ul.ContentList__content_list--q5KXY > li.item');
            items.forEach(item => {
                // '오늘 공개' 뱃지 확인
                const badge = item.querySelector('.Poster__badge_wrap--zo3Dq .blind');
                if (!badge || badge.textContent.trim() !== '오늘 공개') return;

                // url, id, title 추출
                const linkElem = item.querySelector('a.ContentTitle__title_area--x24vt');
                const titleElem = item.querySelector('.ContentTitle__title--e3qXt .text');
                if (!linkElem || !titleElem) return;
                const url = linkElem.getAttribute('href');
                const idMatch = url.match(/titleId=(\d+)/);
                const id = idMatch ? idMatch[1] : null;
                const title = titleElem.textContent.trim();
                if (!id || !url || !title) return;
                result.push({ id, url: `https://comic.naver.com${url}`, platform: 'NAVER', title });
            });
            return result;
        });
        await page.close();
        return newWebtoonList;
    }

    /**
     * 모든 웹툰 리스트를 수집한다.
     * @param {import('puppeteer-core').Browser} browser - Puppeteer 브라우저 인스턴스
     * @returns {Promise<Array<{id: string, title: string, url: string, platform: string}>>} 모든 웹툰 리스트
     */
    async scrapAllWebtoonList(browser) {
        const TABS = [
            'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'dailyPlus'
        ];
        const PLATFORM = 'NAVER';
        const allWebtoons = [];
        const page = await browser.newPage();

        try {
            for (const tab of TABS) {
                const url = `https://comic.naver.com/webtoon?tab=${tab}`;
                await page.goto(url, {
                    waitUntil: 'domcontentloaded',
                    timeout: this.getTimeout('PAGE_LOAD')
                });
                await page.waitForSelector('ul.ContentList__content_list--q5KXY', {
                    timeout: this.getTimeout('SELECTOR_WAIT')
                });

                const webtoons = await page.evaluate((PLATFORM) => {
                    const result = [];
                    const items = document.querySelectorAll('ul.ContentList__content_list--q5KXY > li.item');
                    items.forEach(item => {
                        const linkElem = item.querySelector('a.Poster__link--sopnC');
                        const titleElem = item.querySelector('.ContentTitle__title--e3qXt .text');
                        if (!linkElem || !titleElem) return;
                        const url = linkElem.getAttribute('href');
                        const idMatch = url.match(/titleId=(\d+)/);
                        const id = idMatch ? idMatch[1] : null;
                        const title = titleElem.textContent.trim();
                        if (!id || !url || !title) return;
                        result.push({
                            id,
                            title,
                            url: `https://comic.naver.com${url}`,
                            platform: PLATFORM
                        });
                    });
                    return result;
                }, PLATFORM);
                allWebtoons.push(...webtoons);
            }
        } catch (error) {
            console.error('웹툰 목록 수집 중 오류:', error);
            throw new Error(`웹툰 목록 수집 실패: ${error.message}`);
        } finally {
            await page.close();
        }
        return allWebtoons;
    }

    /**
     * 완결 웹툰 리스트를 스크롤을 통해 모두 수집한다.
     * @param {import('puppeteer-core').Browser} browser - Puppeteer 브라우저 인스턴스
     * @returns {Promise<Array<{id: string, title: string, url: string, platform: string}>>} 완결 웹툰 리스트
     */
    async scrapAllCompletedWebtoonList(browser) {
        const PLATFORM = 'NAVER';
        const url = 'https://comic.naver.com/webtoon?tab=finish';
        const page = await browser.newPage();
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: this.getTimeout('PAGE_LOAD')
        });
        await page.waitForSelector('ul.ContentList__content_list--q5KXY', {
            timeout: this.getTimeout('SELECTOR_WAIT')
        });

        let prevCount = 0;
        let sameCountRepeat = 0;
        const MAX_REPEAT = 10;
        while (true) {
            // 스크롤을 맨 아래로 내림
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            await page.waitForTimeout(1000);
            // 현재 아이템 개수
            const currCount = await page.evaluate(() => document.querySelectorAll('ul.ContentList__content_list--q5KXY > li.item').length);
            if (currCount === prevCount) {
                sameCountRepeat++;
            } else {
                sameCountRepeat = 0;
            }
            if (sameCountRepeat >= MAX_REPEAT) break;
            prevCount = currCount;
        }
        // 모든 아이템 수집
        const webtoons = await page.evaluate((PLATFORM) => {
            const result = [];
            const items = document.querySelectorAll('ul.ContentList__content_list--q5KXY > li.item');
            items.forEach(item => {
                const linkElem = item.querySelector('a.Poster__link--sopnC');
                const titleElem = item.querySelector('.ContentTitle__title--e3qXt .text');
                if (!linkElem || !titleElem) return;
                const url = linkElem.getAttribute('href');
                const idMatch = url.match(/titleId=(\d+)/);
                const id = idMatch ? idMatch[1] : null;
                const title = titleElem.textContent.trim();
                if (!id || !url || !title) return;
                result.push({
                    id,
                    title,
                    url: `https://comic.naver.com${url}`,
                    platform: PLATFORM
                });
            });
            return result;
        }, PLATFORM);
        await page.close();
        return webtoons;
    }
} 