import fetch from 'node-fetch';

export class SlackCoreClient {
    constructor({ webhookUrl, channel, username, messageFormatter }) {
        this.webhookUrl = webhookUrl;
        this.channel = channel;
        this.username = username;
        this.messageFormatter = messageFormatter || (msg => msg);
    }

    async send(payload, type = 'success', options = {}) {
        const message = this.messageFormatter(payload, type, options);
        if (this.channel && !this.webhookUrl.includes('/services/')) {
            message.channel = this.channel;
        }
        message.username = this.username;
        const response = await fetch(this.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        });
        if (!response.ok) {
            throw new Error(`Slack API 오류: ${response.status} ${response.statusText}`);
        }
        return response;
    }
} 