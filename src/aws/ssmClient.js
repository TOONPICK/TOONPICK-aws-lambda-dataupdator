import { SSMClient, GetParametersCommand, GetParameterCommand } from '@aws-sdk/client-ssm';

export class SSMCoreClient {
    constructor(region = 'ap-northeast-2') {
        this.client = new SSMClient({ region });
        this.cache = new Map();
        // 환경 변수에서 파라미터 prefix 가져오기 (기본값 제공)
        this.parameterPrefix = process.env.PARAMETER_STORE_PREFIX || '/TOONPICK/prod/';
    }

    async getParameter(parameterName, useCache = true) {
        const fullParameterName = `${this.parameterPrefix}${parameterName}`;
        if (useCache && this.cache.has(fullParameterName)) {
            return this.cache.get(fullParameterName);
        }
        try {
            const command = new GetParameterCommand({
                Name: fullParameterName,
                WithDecryption: true
            });
            const response = await this.client.send(command);
            const value = response.Parameter.Value;
            if (useCache) {
                this.cache.set(fullParameterName, value);
            }
            console.log(`Parameter Store에서 파라미터 가져옴: ${fullParameterName}`);
            return value;
        } catch (error) {
            console.error(`Parameter Store 파라미터 가져오기 실패: ${fullParameterName}`, error);
            throw new Error(`파라미터 가져오기 실패 (${parameterName}): ${error.message}`);
        }
    }

    async getParameters(parameterNames, useCache = true) {
        const fullParameterNames = parameterNames.map(name => `${this.parameterPrefix}${name}`);
        const result = {};
        try {
            const command = new GetParametersCommand({
                Names: fullParameterNames,
                WithDecryption: true
            });
            const response = await this.client.send(command);
            for (const parameter of response.Parameters) {
                const shortName = parameter.Name.replace(this.parameterPrefix, '');
                result[shortName] = parameter.Value;
                if (useCache) {
                    this.cache.set(parameter.Name, parameter.Value);
                }
            }
            // 누락된 파라미터 확인
            const foundNames = response.Parameters.map(p => p.Name);
            const missingNames = fullParameterNames.filter(name => !foundNames.includes(name));
            if (missingNames.length > 0) {
                console.warn(`누락된 파라미터들: ${missingNames.join(', ')}`);
            }
            console.log(`Parameter Store에서 ${response.Parameters.length}개 파라미터 가져옴`, {
                요청: fullParameterNames,
                응답: response.Parameters.map(p => p.Name)
            });
            return result;
        } catch (error) {
            console.error('Parameter Store 파라미터들 가져오기 실패:', error);
            throw new Error(`파라미터들 가져오기 실패: ${error.message}`);
        }
    }

    async getAllEnvironmentVariables(useCache = true) {
        const parameterNames = [
            'AWS/AWS_SQS_WEBTOON_UPDATE_COMPLETE_URL',
            'AWS/AWS_SQS_WEBTOON_UPDATE_COMPLETE',
            'AWS/AWS_REGION',
            'SLACK/SLACK_WEBHOOK_URL'
        ];
        try {
            const parameters = await this.getParameters(parameterNames, useCache);
            // 파라미터 값들을 로깅 (보안을 위해 일부만)
            console.log('Parameter Store에서 가져온 파라미터들:', {
                'AWS/AWS_SQS_WEBTOON_UPDATE_COMPLETE_URL': parameters['AWS/AWS_SQS_WEBTOON_UPDATE_COMPLETE_URL'] ? '설정됨' : '누락됨',
                'AWS/AWS_SQS_WEBTOON_UPDATE_COMPLETE': parameters['AWS/AWS_SQS_WEBTOON_UPDATE_COMPLETE'] ? '설정됨' : '누락됨',
                'AWS/AWS_REGION': parameters['AWS/AWS_REGION'] || '기본값 사용',
                'SLACK/SLACK_WEBHOOK_URL': parameters['SLACK/SLACK_WEBHOOK_URL'] ? '설정됨' : '누락됨'
            });
            // 기본값 설정
            const envVars = {
                SQS_RESULT_QUEUE_URL: parameters['AWS/AWS_SQS_WEBTOON_UPDATE_COMPLETE_URL'],
                SQS_RESULT_QUEUE_NAME: parameters['AWS/AWS_SQS_WEBTOON_UPDATE_COMPLETE'],
                SQS_RESULT_QUEUE_REGION: parameters['AWS/AWS_REGION'] || 'ap-northeast-2',
                SLACK_WEBHOOK_URL: parameters['SLACK/SLACK_WEBHOOK_URL'],
                SLACK_CHANNEL: '#general',
                SLACK_USERNAME: 'Webtoon Crawler',
                AWS_REGION: parameters['AWS/AWS_REGION'] || 'ap-northeast-2',
                ENVIRONMENT: 'production',
                LOG_LEVEL: 'info'
            };
            if (!envVars.SLACK_WEBHOOK_URL) {
                console.warn('SLACK_WEBHOOK_URL이 설정되지 않았습니다. Slack 알림이 작동하지 않을 수 있습니다.');
            }
            if (!envVars.SQS_RESULT_QUEUE_URL) {
                console.warn('SQS_RESULT_QUEUE_URL이 설정되지 않았습니다. SQS 전송이 작동하지 않을 수 있습니다.');
            }
            return envVars;
        } catch (error) {
            console.error('모든 환경 변수 가져오기 실패:', error);
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
        console.log('Parameter Store 캐시 초기화됨');
    }

    removeFromCache(parameterName) {
        const fullParameterName = `${this.parameterPrefix}${parameterName}`;
        this.cache.delete(fullParameterName);
        console.log(`캐시에서 제거됨: ${fullParameterName}`);
    }

    getParameterPrefix() {
        return this.parameterPrefix;
    }
} 