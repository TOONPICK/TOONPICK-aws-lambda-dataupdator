import fetch from 'node-fetch';
import { getEnvVar } from '../config/env.js';

export class SlackService {
    constructor() {
        this.webhookUrl = null;
        this.channel = null;
        this.username = null;
        this.initialized = false;
    }

    /**
     * 서비스 초기화 (Parameter Store에서 설정 가져오기)
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            const [webhookUrl, channel, username] = await Promise.all([
                getEnvVar('SLACK_WEBHOOK_URL'),
                getEnvVar('SLACK_CHANNEL'),
                getEnvVar('SLACK_USERNAME')
            ]);

            // Webhook URL 검증
            if (!webhookUrl) {
                throw new Error('SLACK_WEBHOOK_URL이 설정되지 않았습니다.');
            }
            
            if (!webhookUrl.startsWith('https://hooks.slack.com/')) {
                console.warn(`잘못된 Slack Webhook URL 형식: ${webhookUrl.substring(0, 50)}...`);
            }

            this.webhookUrl = webhookUrl;
            this.channel = channel;
            this.username = username;
            this.initialized = true;
            
            console.log('Slack 서비스 초기화 완료', {
                webhookUrl: webhookUrl ? `${webhookUrl.substring(0, 30)}...` : '설정되지 않음',
                channel: channel,
                username: username
            });
        } catch (error) {
            console.error('Slack 서비스 초기화 실패:', error);
            throw new Error(`Slack 서비스 초기화 실패: ${error.message}`);
        }
    }

    /**
     * 성공 메시지를 Slack으로 전송
     * @param {Object} result - 크롤링 결과
     * @param {string} requestId - 요청 ID
     * @param {Object} context - 추가 컨텍스트 정보
     * @returns {Promise<Object>} 전송 결과
     */
    async sendSuccess(result, requestId, context = {}) {
        await this.initialize();

        try {
            const message = {
                username: this.username,
                icon_emoji: ':white_check_mark:',
                attachments: [
                    {
                        color: 'good',
                        title: '웹툰 크롤링 성공',
                        fields: [
                            {
                                title: '요청 ID',
                                value: requestId,
                                short: true
                            },
                            {
                                title: '플랫폼',
                                value: context.platform || 'Unknown',
                                short: true
                            },
                            {
                                title: '수집된 데이터 수',
                                value: this._getDataCount(result),
                                short: true
                            },
                            {
                                title: '처리 시간',
                                value: context.processingTime ? `${context.processingTime}ms` : 'Unknown',
                                short: true
                            }
                        ],
                        footer: 'Webtoon Crawler',
                        ts: Math.floor(Date.now() / 1000)
                    }
                ]
            };

            // Webhook URL에 채널이 포함되어 있지 않은 경우에만 채널 지정
            if (this.channel && !this.webhookUrl.includes('/services/')) {
                message.channel = this.channel;
            }

            const response = await this._sendToSlack(message);
            
            console.log('Slack 성공 메시지 전송 완료');
            return {
                success: true,
                requestId: requestId
            };
        } catch (error) {
            console.error('Slack 성공 메시지 전송 실패:', error);
            throw new Error(`Slack 성공 알림 실패: ${error.message}`);
        }
    }

    /**
     * 에러 메시지를 Slack으로 전송
     * @param {Error} error - 에러 객체
     * @param {string} requestId - 요청 ID
     * @param {Object} context - 추가 컨텍스트 정보
     * @returns {Promise<Object>} 전송 결과
     */
    async sendError(error, requestId, context = {}) {
        await this.initialize();

        try {
            const message = {
                username: this.username,
                icon_emoji: ':x:',
                attachments: [
                    {
                        color: 'danger',
                        title: '웹툰 크롤링 실패',
                        fields: [
                            {
                                title: '요청 ID',
                                value: requestId,
                                short: true
                            },
                            {
                                title: '플랫폼',
                                value: context.platform || 'Unknown',
                                short: true
                            },
                            {
                                title: '에러 메시지',
                                value: error.message,
                                short: false
                            },
                            {
                                title: '에러 타입',
                                value: error.name || 'Unknown',
                                short: true
                            }
                        ],
                        footer: 'Webtoon Crawler',
                        ts: Math.floor(Date.now() / 1000)
                    }
                ]
            };

            // Webhook URL에 채널이 포함되어 있지 않은 경우에만 채널 지정
            if (this.channel && !this.webhookUrl.includes('/services/')) {
                message.channel = this.channel;
            }

            const response = await this._sendToSlack(message);
            
            console.log('Slack 에러 메시지 전송 완료');
            return {
                success: true,
                requestId: requestId
            };
        } catch (slackError) {
            console.error('Slack 에러 메시지 전송 실패:', slackError);
            throw new Error(`Slack 에러 알림 실패: ${slackError.message}`);
        }
    }

    /**
     * Slack Webhook으로 메시지 전송
     * @param {Object} message - 전송할 메시지 객체
     * @returns {Promise<Response>} HTTP 응답
     */
    async _sendToSlack(message) {
        if (!this.webhookUrl) {
            throw new Error('Slack Webhook URL이 설정되지 않았습니다.');
        }

        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Slack API 응답 오류:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: this.webhookUrl.substring(0, 50) + '...',
                    errorText: errorText.substring(0, 200)
                });
                throw new Error(`Slack API 응답 오류: ${response.status} ${response.statusText} - ${errorText}`);
            }

            return response;
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error(`Slack Webhook URL에 연결할 수 없습니다: ${this.webhookUrl.substring(0, 50)}...`);
            }
            throw error;
        }
    }

    /**
     * 결과 데이터에서 수집된 데이터 수를 계산
     * @param {Object} result - 크롤링 결과
     * @returns {string} 데이터 수 문자열
     */
    _getDataCount(result) {
        if (!result) return '0';
        
        if (Array.isArray(result)) {
            return result.length.toString();
        }
        
        if (result.data && Array.isArray(result.data)) {
            return result.data.length.toString();
        }
        
        if (result.items && Array.isArray(result.items)) {
            return result.items.length.toString();
        }
        
        return '1'; // 단일 객체인 경우
    }
} 