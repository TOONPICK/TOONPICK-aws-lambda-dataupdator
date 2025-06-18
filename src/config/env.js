// AWS Lambda 환경 변수 설정
export const ENV_CONFIG = {
    // SQS 설정
    SQS_RESULT_QUEUE_URL: process.env.SQS_RESULT_QUEUE_URL,
    SQS_RESULT_QUEUE_REGION: process.env.SQS_RESULT_QUEUE_REGION || 'ap-northeast-2',
    
    // Slack 설정
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
    SLACK_CHANNEL: process.env.SLACK_CHANNEL || '#webtoon-crawler',
    SLACK_USERNAME: process.env.SLACK_USERNAME || 'Webtoon Crawler',
    
    // AWS 설정
    AWS_REGION: process.env.AWS_REGION || 'ap-northeast-2',
    
    // 기타 설정
    ENVIRONMENT: process.env.ENVIRONMENT || 'production',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// 환경 변수 유효성 검사
export function validateEnvironmentVariables() {
    const requiredVars = [
        'SQS_RESULT_QUEUE_URL',
        'SLACK_WEBHOOK_URL'
    ];
    
    const missingVars = requiredVars.filter(varName => !ENV_CONFIG[varName]);
    
    if (missingVars.length > 0) {
        throw new Error(`필수 환경 변수가 누락되었습니다: ${missingVars.join(', ')}`);
    }
}

// 환경 변수 가져오기 헬퍼 함수
export function getEnvVar(key, defaultValue = null) {
    const value = ENV_CONFIG[key];
    if (value === undefined && defaultValue === null) {
        throw new Error(`환경 변수 ${key}가 설정되지 않았습니다.`);
    }
    return value || defaultValue;
} 