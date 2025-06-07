import { Crawler } from './src/core/crawler.js';
import { LocalBrowser } from './src/browsers/localBrowser.js';

async function main() {
    // 테스트용 SQS 메시지 생성
    const testEvent = {
        Records: [
            {
                messageId: 'test-1',
                body: JSON.stringify({
                    requestId: 'test-1',
                    eventType: 'WEBTOON_CRAWL',
                    data: {
                        titleId: '183559',  // 네이버 웹툰 "신의 탑"
                        platform: 'NAVER'
                    }
                })
            }
        ]
    };

    // 브라우저와 크롤러 생성
    const browserType = new LocalBrowser();
    const crawler = new Crawler(browserType);
    
    try {
        // 크롤링 실행
        const result = await crawler.execute(JSON.parse(testEvent.Records[0].body));
        console.log('크롤링 결과:', JSON.parse(result.body));
    } catch (error) {
        console.error('크롤링 실패:', error);
    }
}

main().catch(console.error); 