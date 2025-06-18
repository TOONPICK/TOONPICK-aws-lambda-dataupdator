import fetch from 'node-fetch';
import { getEnvVar } from '../config/env.js';

export class SlackService {
    constructor() {
        this.webhookUrl = getEnvVar('SLACK_WEBHOOK_URL');
        this.channel = getEnvVar('SLACK_CHANNEL');
        this.username = getEnvVar('SLACK_USERNAME');
    }

    /**
     * 성공 메시지를 Slack으로 전송
     * @param {Object} result - 크롤링 결과
     * @param {string} requestId - 요청 ID
     * @param {Object} context - 추가 컨텍스트 정보
     * @returns {Promise<Object>} 전송 결과
     */
    async sendSuccess(result, requestId, context = {}) {
        try {
            const message = {
                channel: this.channel,
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
        try {
            const message = {
                channel: this.channel,
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
        const response = await fetch(this.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        });

        if (!response.ok) {
            throw new Error(`Slack API 응답 오류: ${response.status} ${response.statusText}`);
        }

        return response;
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