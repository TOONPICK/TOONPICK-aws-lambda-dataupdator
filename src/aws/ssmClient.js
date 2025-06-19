import { SSMClient, GetParametersCommand, GetParameterCommand } from '@aws-sdk/client-ssm';

export class SSMCoreClient {
    constructor(region = 'ap-northeast-2', parameterPrefix = '/TOONPICK/prod/') {
        this.client = new SSMClient({ region });
        this.parameterPrefix = parameterPrefix;
    }

    async getParameter(parameterName) {
        const fullParameterName = `${this.parameterPrefix}${parameterName}`;
        const command = new GetParameterCommand({ Name: fullParameterName, WithDecryption: true });
        const response = await this.client.send(command);
        return response.Parameter.Value;
    }

    async getParameters(parameterNames) {
        const fullNames = parameterNames.map(name => `${this.parameterPrefix}${name}`);
        const command = new GetParametersCommand({ Names: fullNames, WithDecryption: true });
        const response = await this.client.send(command);
        const result = {};
        for (const parameter of response.Parameters) {
            const shortName = parameter.Name.replace(this.parameterPrefix, '');
            result[shortName] = parameter.Value;
        }
        return result;
    }

    async getAllEnvironmentVariables() {
        // 실제 환경에 맞게 파라미터 이름을 조정하세요
        const parameterNames = [
            'AWS/AWS_SQS_WEBTOON_UPDATE_COMPLETE_URL',
            'AWS/AWS_SQS_WEBTOON_UPDATE_COMPLETE',
            'AWS/AWS_REGION',
            'SLACK/SLACK_WEBHOOK_URL'
        ];
        return await this.getParameters(parameterNames);
    }
} 