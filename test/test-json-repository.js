import { JsonRepository } from '../src/repository/jsonRepository.js';

async function testJsonRepository() {
    console.log('=== JSON Repository 테스트 시작 ===\n');

    // 1. 기본 설정으로 Repository 생성
    const repository = new JsonRepository({
        basePath: './output',
        prettyPrint: true,
        createDirectory: true
    });

    // 2. 단일 데이터 저장 테스트
    console.log('1. 단일 데이터 저장 테스트...');
    const testData = {
        id: 1,
        title: '테스트 웹툰',
        url: 'https://example.com',
        platform: 'NAVER',
        timestamp: new Date().toISOString()
    };

    try {
        const savedPath = await repository.save(testData, 'test_webtoon');
        console.log(`저장 완료: ${savedPath}\n`);
    } catch (error) {
        console.error('저장 실패:', error.message);
    }

    // 3. 여러 데이터 저장 테스트
    console.log('2. 여러 데이터 저장 테스트...');
    const multipleData = [
        { data: { id: 1, title: '웹툰1' }, filename: 'webtoon_1' },
        { data: { id: 2, title: '웹툰2' }, filename: 'webtoon_2' },
        { data: { id: 3, title: '웹툰3' }, filename: 'webtoon_3' }
    ];

    try {
        const savedPaths = await repository.saveMultiple(multipleData);
        console.log(`여러 파일 저장 완료: ${savedPaths.length}개 파일\n`);
    } catch (error) {
        console.error('여러 파일 저장 실패:', error.message);
    }

    // 4. 타임스탬프 포함 저장 테스트
    console.log('3. 타임스탬프 포함 저장 테스트...');
    const timestampData = {
        totalCount: 100,
        webtoons: [
            { id: '123', title: '인기 웹툰 1' },
            { id: '456', title: '인기 웹툰 2' }
        ],
        collectedAt: new Date().toISOString()
    };

    try {
        const timestampPath = await repository.saveWithTimestamp(timestampData, 'popular_webtoons');
        console.log(`타임스탬프 저장 완료: ${timestampPath}\n`);
    } catch (error) {
        console.error('타임스탬프 저장 실패:', error.message);
    }

    // 5. 파일 존재 확인 테스트
    console.log('4. 파일 존재 확인 테스트...');
    try {
        const exists = await repository.exists('test_webtoon');
        console.log(`test_webtoon.json 파일 존재 여부: ${exists}\n`);
    } catch (error) {
        console.error('파일 존재 확인 실패:', error.message);
    }

    // 6. 파일 읽기 테스트
    console.log('5. 파일 읽기 테스트...');
    try {
        const loadedData = await repository.load('test_webtoon');
        console.log('읽어온 데이터:', JSON.stringify(loadedData, null, 2));
        console.log('');
    } catch (error) {
        console.error('파일 읽기 실패:', error.message);
    }

    // 7. 파일 목록 조회 테스트
    console.log('6. 파일 목록 조회 테스트...');
    try {
        const files = await repository.listFiles();
        console.log('저장된 파일 목록:', files);
        console.log('');
    } catch (error) {
        console.error('파일 목록 조회 실패:', error.message);
    }

    // 8. 설정 업데이트 테스트
    console.log('7. 설정 업데이트 테스트...');
    repository.updateOptions({
        basePath: './output/backup',
        prettyPrint: false
    });

    const compactData = { message: '압축된 JSON 데이터' };
    try {
        const compactPath = await repository.save(compactData, 'compact_data');
        console.log(`압축 저장 완료: ${compactPath}\n`);
    } catch (error) {
        console.error('압축 저장 실패:', error.message);
    }

    // 9. 파일 삭제 테스트
    console.log('8. 파일 삭제 테스트...');
    try {
        const deleted = await repository.delete('compact_data');
        console.log(`파일 삭제 성공: ${deleted}\n`);
    } catch (error) {
        console.error('파일 삭제 실패:', error.message);
    }

    // 10. 현재 설정 확인
    console.log('9. 현재 설정 확인...');
    const currentOptions = repository.getOptions();
    console.log('현재 설정:', JSON.stringify(currentOptions, null, 2));

    console.log('\n=== JSON Repository 테스트 완료 ===');
}

// 테스트 실행
testJsonRepository().catch(console.error); 