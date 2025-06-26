import { ContentCollector } from './contentCollector.js';

/**
 * 신작 웹툰을 탐색하고 정보를 수집하는 Collector
 */
export class NewWebtoonCollector extends ContentCollector {
    /**
     * 신작 웹툰을 탐색하고 정보를 수집한다.
     * @param {import('puppeteer-core').Browser} browser - Puppeteer 브라우저 인스턴스
     * @param {Object} data - 추가 데이터(필요시)
     * @returns {Promise<ScrapResult>} 수집 결과
     */
    async execute(browser, data) {

    }
} 