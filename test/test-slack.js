// test-slack.js
import { SlackService } from './src/utils/slackService.js';

async function testSlack() {
    try {
        console.log('Slack 서비스 테스트 시작...');
        
        const slackService = new SlackService();
        
        // 초기화 테스트
        await slackService.initialize();
        
        // 테스트 메시지 전송
        const testResult = await slackService.sendSuccess(
            { test: 'data' },
            'test-request-id',
            { platform: 'test', type: 'test', processingTime: 1000 }
        );
        
        console.log('Slack 테스트 성공:', testResult);
        
    } catch (error) {
        console.error('Slack 테스트 실패:', error.message);
        console.error('전체 오류:', error);
    }
}

testSlack(); 