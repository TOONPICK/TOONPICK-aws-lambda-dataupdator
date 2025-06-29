import { WebtoonContentCollector } from './webtoonContentCollector.js';
import { WebtoonUpdateCollector } from './webtoonUpdateCollector.js';
import { NewWebtoonCollector } from './newWebtoonCollector.js';
import { AllWebtoonCollector } from './allWebtoonCollector.js';

/**
 * ContentCollector 생성을 담당하는 팩토리 클래스
 */
export class CollectorFactory {
    constructor() {
        this.collectors = new Map([
            ['WEBTOON_CRAWL', () => new WebtoonContentCollector()],
            ['WEBTOON_UPDATE', () => new WebtoonUpdateCollector()],
            ['NEW_WEBTOON', () => new NewWebtoonCollector()],
            ['ALL_WEBTOON', () => new AllWebtoonCollector()]
        ]);
    }

    /**
     * 이벤트 타입에 맞는 Collector를 생성합니다.
     * @param {string} eventType - 이벤트 타입
     * @returns {import('./contentCollector.js').ContentCollector} Collector 인스턴스
     * @throws {Error} 지원하지 않는 이벤트 타입인 경우
     */
    createCollector(eventType) {
        const factory = this.collectors.get(eventType);
        if (!factory) {
            throw new Error(`지원하지 않는 이벤트 타입입니다: ${eventType}`);
        }
        return factory();
    }

    /**
     * 새로운 Collector 타입을 등록합니다.
     * @param {string} eventType - 이벤트 타입
     * @param {function(): import('./contentCollector.js').ContentCollector} factory - Collector 생성 함수
     */
    registerCollector(eventType, factory) {
        this.collectors.set(eventType, factory);
    }
} 