import { ParameterStoreService } from '../utils/parameterStoreService.js';

// 전역 Parameter Store 서비스 인스턴스
let parameterStoreService = null;
let envConfig = null;

// Parameter Store 서비스 초기화
function initializeParameterStore() {
    if (!parameterStoreService) {
        // 기본 리전은 환경 변수에서 가져오거나 기본값 사용
        const defaultRegion = process.env.AWS_REGION || 'ap-northeast-2';
        parameterStoreService = new ParameterStoreService(defaultRegion);
    }
    return parameterStoreService;
}

// 환경 변수 설정 (Parameter Store에서 가져옴)
export async function getEnvironmentConfig() {
    if (envConfig) {
        return envConfig;
    }

    try {
        const ssm = initializeParameterStore();
        envConfig = await ssm.getAllEnvironmentVariables();
        return envConfig;
    } catch (error) {
        console.error('Parameter Store에서 환경 변수 가져오기 실패:', error);
        throw new Error(`환경 변수 로드 실패: ${error.message}`);
    }
}

// 환경 변수 유효성 검사
export async function validateEnvironmentVariables() {
    const config = await getEnvironmentConfig();
    
    const requiredVars = [
        'SQS_RESULT_QUEUE_URL',
        'SLACK_WEBHOOK_URL'
    ];
    
    const missingVars = requiredVars.filter(varName => !config[varName]);
    
    if (missingVars.length > 0) {
        throw new Error(`필수 환경 변수가 누락되었습니다: ${missingVars.join(', ')}`);
    }
}

// 환경 변수 가져오기 헬퍼 함수
export async function getEnvVar(key, defaultValue = null) {
    const config = await getEnvironmentConfig();
    const value = config[key];
    
    if (value === undefined && defaultValue === null) {
        throw new Error(`환경 변수 ${key}가 설정되지 않았습니다.`);
    }
    return value || defaultValue;
}

// 특정 환경 변수들만 가져오기
export async function getEnvVars(keys) {
    const config = await getEnvironmentConfig();
    const result = {};
    
    for (const key of keys) {
        result[key] = config[key];
    }
    
    return result;
}

// 캐시 초기화 (테스트나 재로드 시 사용)
export function clearEnvironmentCache() {
    envConfig = null;
    if (parameterStoreService) {
        parameterStoreService.clearCache();
    }
}

// Parameter Store 서비스 인스턴스 반환 (고급 사용을 위해)
export function getParameterStoreService() {
    return initializeParameterStore();
}

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