/**
 * @typedef {'NAVER' | 'KAKAO' | 'LEZIN'} WebtoonPlatform
 */

/**
 * @typedef {'FREE' | 'PAID'} EpisodePricingType
 */

/**
 * @typedef {'ORIGINAL' | 'BOOK'} NovelType
 */

/**
 * @typedef {Object} Novel
 * @property {string} title - 웹소설 제목
 * @property {string} link - 웹소설 링크
 * @property {string} thumbnailUrl - 썸네일 URL
 * @property {NovelType} type - 웹소설 타입 (원작/단행본)
 * @property {number} [freeEpisodeCount] - 무료 회차 수
 */

/**
 * @typedef {Object} WebtoonData
 * @property {string} titleId - 웹툰의 titleId
 * @property {WebtoonPlatform} [platform='NAVER'] - 웹툰 플랫폼
 */

/**
 * @typedef {Object} WebtoonEpisode
 * @property {string} title - 에피소드 제목
 * @property {string} uploadDate - 업로드 날짜 (ISO 형식)
 * @property {string} link - 에피소드 링크
 * @property {number} episodeNumber - 에피소드 번호
 * @property {string} thumbnailUrl - 썸네일 URL
 * @property {EpisodePricingType} pricingType - 유료/무료 구분
 * @property {number|null} [daysUntilFree] - 무료화까지 남은 일수 (유료회차인 경우)
 * @property {string|null} [mobileUrl] - 모바일 URL
 */

/**
 * @typedef {Object} WebtoonAuthor
 * @property {string} id - 작가 ID
 * @property {string} name - 작가 이름
 * @property {string} role - 작가 역할
 */

/**
 * @typedef {Object} WebtoonScrapResult
 * @property {string} id - 웹툰 ID
 * @property {string} url - 웹툰 URL
 * @property {string} title - 웹툰 제목
 * @property {string} uniqueId - 웹툰 고유 ID
 * @property {WebtoonPlatform} platform - 웹툰 플랫폼
 * @property {string} description - 웹툰 설명
 * @property {string} thumbnailUrl - 썸네일 URL
 * @property {string} dayOfWeek - 연재 요일
 * @property {'ONGOING' | 'COMPLETED' | 'HIATUS'} status - 연재 상태
 * @property {'ALL' | 'AGE_12' | 'AGE_15' | 'ADULT'} ageRating - 연령 등급
 * @property {number} episodeCount - 총 에피소드 수
 * @property {number} previewCount - 미리보기 수
 * @property {string[]} genres - 장르 목록
 * @property {WebtoonAuthor[]} authors - 작가 정보
 * @property {string} publishStartDate - 연재 시작일 (ISO 형식)
 * @property {string} lastUpdatedDate - 마지막 업데이트일 (ISO 형식)
 * @property {WebtoonEpisode[]} episodes - 에피소드 회차 정보
 * @property {Novel[]} relatedNovels - 관련 웹소설 목록
 * @property {string[]} relatedWebtoonIds - 관련 웹툰 ID 목록
 */

/**
 * @typedef {Object} WebtoonCreateCommand
 * @property {string} id - 웹툰 ID
 * @property {string} url - 웹툰 URL
 * @property {string} title - 웹툰 제목
 * @property {string} uniqueId - 웹툰 고유 ID
 * @property {WebtoonPlatform} platform - 웹툰 플랫폼
 * @property {string} description - 웹툰 설명
 * @property {string} thumbnailUrl - 썸네일 URL
 * @property {string} dayOfWeek - 연재 요일
 * @property {'ONGOING' | 'COMPLETED' | 'HIATUS'} status - 연재 상태
 * @property {'ALL' | 'AGE_12' | 'AGE_15' | 'ADULT'} ageRating - 연령 등급
 * @property {number} episodeCount - 총 에피소드 수
 * @property {number} previewCount - 미리보기 수
 * @property {string[]} genres - 장르 목록
 * @property {WebtoonAuthor[]} authors - 작가 정보
 * @property {string} publishStartDate - 연재 시작일 (ISO 형식)
 * @property {string} lastUpdatedDate - 마지막 업데이트일 (ISO 형식)
 * @property {WebtoonEpisode[]} episodes - 에피소드 회차 정보
 * @property {Novel[]} relatedNovels - 관련 웹소설 목록
 * @property {string[]} relatedWebtoonIds - 관련 웹툰 ID 목록
 */

/**
 * @typedef {Object} WebtoonEpisodeUpdateCommand
 * @property {string} id - 웹툰 ID
 * @property {string} url - 웹툰 URL
 * @property {string} title - 웹툰 제목
 * @property {string} uniqueId - 웹툰 고유 ID
 * @property {WebtoonPlatform} platform - 웹툰 플랫폼
 * @property {string} description - 웹툰 설명
 * @property {string} thumbnailUrl - 썸네일 URL
 * @property {string} dayOfWeek - 연재 요일
 * @property {'ONGOING' | 'COMPLETED' | 'HIATUS'} status - 연재 상태
 * @property {'ALL' | 'AGE_12' | 'AGE_15' | 'ADULT'} ageRating - 연령 등급
 * @property {number} episodeCount - 총 에피소드 수
 * @property {number} previewCount - 미리보기 수
 * @property {string[]} genres - 장르 목록
 * @property {WebtoonAuthor[]} authors - 작가 정보
 * @property {string} publishStartDate - 연재 시작일 (ISO 형식)
 * @property {string} lastUpdatedDate - 마지막 업데이트일 (ISO 형식)
 * @property {WebtoonEpisode[]} episodes - 에피소드 회차 정보
 * @property {Novel[]} relatedNovels - 관련 웹소설 목록
 * @property {string[]} relatedWebtoonIds - 관련 웹툰 ID 목록
 */

/**
 * @typedef {Object} WebtoonUpdateResult
 * @property {string} id - 웹툰 ID
 * @property {string} url - 웹툰 URL
 * @property {WebtoonPlatform} platform - 웹툰 플랫폼
 * @property {WebtoonEpisode[]} episodes - 최신 에피소드 목록 (무료/유료 통합)
 * @property {string} lastUpdatedDate - 마지막 업데이트 날짜
 * @property {string} [message] - 메시지 (업데이트가 없을 경우)
 */

/**
 * @typedef {Object} NewWebtoonInfo
 * @property {string} id - 웹툰 ID
 * @property {string} url - 웹툰 URL
 * @property {import('./webtoon.js').WebtoonPlatform} platform - 웹툰 플랫폼
 * @property {string} title - 웹툰 제목
 */

/**
 * 웹툰 데이터를 Java에서 기대하는 형식으로 변환합니다.
 * @param {Object} rawData - 크롤링된 원본 데이터 (WebtoonScrapResult)
 * @param {string} eventType - 이벤트 타입
 * @returns {WebtoonCreateCommand|WebtoonEpisodeUpdateCommand}
 */
export function formatWebtoonData(rawData, eventType) {
    // rawData가 이미 적절한 형식인지 확인
    if (rawData.id && rawData.title && rawData.platform) {
        return rawData;
    }
    
    // WebtoonScrapResult를 Java에서 기대하는 형식으로 변환
    const formattedData = {
        id: rawData.id || rawData.uniqueId || `webtoon_${Date.now()}`,
        url: rawData.url || '',
        title: rawData.title || 'Unknown Title',
        uniqueId: rawData.uniqueId || rawData.id || `webtoon_${Date.now()}`,
        platform: rawData.platform || 'NAVER',
        description: rawData.description || '',
        thumbnailUrl: rawData.thumbnailUrl || '',
        dayOfWeek: rawData.dayOfWeek || '',
        status: rawData.status || 'ONGOING',
        ageRating: rawData.ageRating || 'ALL',
        episodeCount: rawData.episodeCount || 0,
        previewCount: rawData.previewCount || 0,
        genres: rawData.genres || [],
        authors: rawData.authors || [],
        latestFreeEpisode: rawData.latestFreeEpisode || [],
        publishStartDate: rawData.publishStartDate || '',
        lastUpdatedDate: rawData.lastUpdatedDate || '',
        episodes: rawData.episodes || [],
        relatedNovels: rawData.relatedNovels || [],
        relatedWebtoonIds: rawData.relatedWebtoonIds || []
    };
    
    return formattedData;
}

/**
 * 스크래퍼 결과에 응답 이벤트 타입을 추가합니다.
 * @param {Object} scrapedData - 스크래퍼에서 수집한 데이터
 * @param {string} requestEventType - 요청 이벤트 타입
 * @returns {Object} 응답 이벤트 타입이 포함된 데이터
 */
export function addResponseEventType(scrapedData, requestEventType) {
    let responseEventType;
    
    console.log(`addResponseEventType 호출:`, {
        requestEventType,
        scrapedDataKeys: Object.keys(scrapedData || {})
    });
    
    switch (requestEventType) {
        case 'WEBTOON_CONTENT':
            // 전체 웹툰 정보를 수집한 경우
            responseEventType = 'CRAWL_WEBTOON_NEW';
            break;
        case 'WEBTOON_UPDATE':
            // 업데이트 정보를 수집한 경우
            responseEventType = 'CRAWL_WEBTOON_EPISODE';
            break;
        default:
            responseEventType = 'CRAWL_WEBTOON_EPISODE';
    }
    
    console.log(`매핑 결과:`, {
        requestEventType,
        responseEventType
    });
    
    return {
        ...scrapedData,
        responseEventType
    };
} 