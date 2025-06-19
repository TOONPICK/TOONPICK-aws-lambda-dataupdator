import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

export class SQSCoreClient {
    constructor({ region, queueUrl, isFifoQueue = false, messageFormatter }) {
        this.client = new SQSClient({ region });
        this.queueUrl = queueUrl;
        this.isFifoQueue = isFifoQueue;
        this.messageFormatter = messageFormatter || (msg => msg);
    }

    async send(payload, options = {}) {
        const { requestId, type = 'result' } = options;
        const messageBody = this.messageFormatter(payload, type, options);
        const commandParams = {
            QueueUrl: this.queueUrl,
            MessageBody: typeof messageBody === 'string' ? messageBody : JSON.stringify(messageBody)
        };
        if (this.isFifoQueue && requestId) {
            commandParams.MessageGroupId = requestId;
            commandParams.MessageDeduplicationId = `${requestId}-${type}-${Date.now()}`;
        }
        const command = new SendMessageCommand(commandParams);
        return await this.client.send(command);
    }
} 