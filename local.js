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
                    eventType: 'WEBTOON_CONTENT',
                    data: [
                        {
                            id: 832557,
                            url: 'https://comic.naver.com/webtoon/list?titleId=832557',
                            platform: 'NAVER',
                            episodeCount: 42
                        }
                    ]
                })
            }
        ]
    };

    // 브라우저와 크롤러 생성
    const browserType = new LocalBrowser();
    const crawler = new Crawler(browserType);
    
    try {
        // 크롤링 실행
        const results = await crawler.execute(JSON.parse(testEvent.Records[0].body));
        if (Array.isArray(results)) {
            results.forEach((result, idx) => {
                console.log(`크롤링 결과 [${idx}]:`);
                console.log(JSON.stringify(result, null, 2));
                console.log('---');
            });
        } else {
            console.log('크롤링 결과:');
            console.log(JSON.stringify(results, null, 2));
        }
    } catch (error) {
        console.error('크롤링 실패:', error);
    }
}

main().catch(console.error); 