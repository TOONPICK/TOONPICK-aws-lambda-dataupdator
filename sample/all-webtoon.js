import { Crawler } from '../src/core/crawler.js';
import { LocalBrowser } from '../src/browsers/localBrowser.js';
import { JsonRepository } from '../src/repository/jsonRepository.js';

async function main() {
    const testEvent = {
        Records: [
            {
                messageId: 'all-webtoon-1',
                body: JSON.stringify({
                    requestId: 'all-webtoon-1',
                    eventType: 'CRAWL_WEBTOON_ALL',
                    data: {}
                })
            }
        ]
    };

    // 브라우저와 크롤러 생성
    const browserType = new LocalBrowser();
    const crawler = new Crawler(browserType);
    
    // JSON 저장소 생성
    const repository = new JsonRepository({
        basePath: './output/webtoons',
        prettyPrint: true,
        createDirectory: true
    });
    
    try {
        console.log('=== 모든 웹툰 수집 및 저장 시작 ===\n');
        
        // 크롤링 실행
        const results = await crawler.execute(JSON.parse(testEvent.Records[0].body));
        
        if (results.statusCode === 200) {
            console.log('크롤링 성공!');
            console.log(`수집된 웹툰 수: ${results.data.length}개`);
            
            // 수집된 데이터를 JSON 파일로 저장
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `all_webtoons_${timestamp}`;
            
            const savedPath = await repository.save(results.data, filename);
            console.log(`데이터 저장 완료: ${savedPath}`);
            
            // 샘플 데이터 출력 (처음 3개)
            console.log('\n=== 샘플 데이터 (처음 3개) ===');
            results.data.slice(0, 3).forEach((webtoon, index) => {
                console.log(`${index + 1}. ${webtoon.title} (${webtoon.platform})`);
            });
            
        } else {
            console.error('크롤링 실패:', results.message);
            console.log('에러 데이터:', JSON.stringify(results.data, null, 2));
        }
        
    } catch (error) {
        console.error('크롤링 실패:', error);
    }
}

main().catch(console.error); 