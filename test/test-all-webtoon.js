import { LocalBrowser } from '../src/browsers/localBrowser.js';
import { NaverScraper } from '../src/scrapers/naverScraper.js';

/**
 * 모든 웹툰 탐색 메서드 테스트
 */
async function testAllWebtoonMethods() {
    const browser = new LocalBrowser();
    const scraper = new NaverScraper();
    
    try {
        console.log('=== 모든 웹툰 탐색 메서드 테스트 시작 ===\n');
        
        // 1. 신작 웹툰 리스트 테스트
        console.log('1. 신작 웹툰 리스트 수집 테스트...');
        const newWebtoons = await scraper.scrapNewWebtoonList(browser);
        console.log(`신작 웹툰 ${newWebtoons.length}개 수집 완료`);
        console.log('샘플 데이터:', newWebtoons.slice(0, 3));
        console.log('\n');

        // 2. 전체 웹툰 리스트 테스트 (1페이지만)
        console.log('2. 전체 웹툰 리스트 수집 테스트 (1페이지)...');
        const allWebtoons = await scraper.scrapAllWebtoonList(browser, { maxPages: 1 });
        console.log(`전체 웹툰 ${allWebtoons.length}개 수집 완료`);
        console.log('샘플 데이터:', allWebtoons.slice(0, 3));
        console.log('\n');

        // 3. 카테고리별 웹툰 리스트 테스트
        console.log('3. 완결 웹툰 리스트 수집 테스트...');
        const completedWebtoons = await scraper.scrapCompletedWebtoonList(browser, { maxPages: 1 });
        console.log(`완결 웹툰 ${completedWebtoons.length}개 수집 완료`);
        console.log('샘플 데이터:', completedWebtoons.slice(0, 3));
        console.log('\n');

        // 4. 인기 웹툰 리스트 테스트
        console.log('4. 인기 웹툰 리스트 수집 테스트...');
        const popularWebtoons = await scraper.scrapPopularWebtoonList(browser, { period: 'daily' });
        console.log(`인기 웹툰 ${popularWebtoons.length}개 수집 완료`);
        console.log('샘플 데이터:', popularWebtoons.slice(0, 3));
        console.log('\n');

        // 5. 특정 카테고리 웹툰 리스트 테스트
        console.log('5. 평일 웹툰 리스트 수집 테스트...');
        const weekdayWebtoons = await scraper.scrapWebtoonListByCategory(browser, 'weekday', { maxPages: 1 });
        console.log(`평일 웹툰 ${weekdayWebtoons.length}개 수집 완료`);
        console.log('샘플 데이터:', weekdayWebtoons.slice(0, 3));
        console.log('\n');

        console.log('=== 모든 테스트 완료 ===');
        
        // 결과 요약
        console.log('\n=== 수집 결과 요약 ===');
        console.log(`신작 웹툰: ${newWebtoons.length}개`);
        console.log(`전체 웹툰: ${allWebtoons.length}개`);
        console.log(`완결 웹툰: ${completedWebtoons.length}개`);
        console.log(`인기 웹툰: ${popularWebtoons.length}개`);
        console.log(`평일 웹툰: ${weekdayWebtoons.length}개`);

    } catch (error) {
        console.error('테스트 중 오류 발생:', error);
    } finally {
        await browser.close();
    }
}

// 테스트 실행
testAllWebtoonMethods().catch(console.error); 