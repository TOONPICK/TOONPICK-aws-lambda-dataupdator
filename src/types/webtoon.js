/**
 * @typedef {'NAVER' | 'KAKAO' | 'LEZIN'} WebtoonPlatform
 */

/**
 * @typedef {'FREE' | 'PAID'} EpisodePricingType
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
 * @property {WebtoonEpisode} latestFreeEpisode - 최신 무료 회차 정보
 * @property {string} publishStartDate - 연재 시작일 (ISO 형식)
 * @property {string} lastUpdatedDate - 마지막 업데이트일 (ISO 형식)
 * @property {string} htmlFilePath - 저장된 HTML 파일 경로
 * @property {WebtoonEpisode[]} freeEpisodes - 모든 무료 회차 정보
 */

/**
 * @typedef {Object} WebtoonEpisodeUpdateCommand
 * @property {string} webtoonId - 웹툰 ID
 * @property {string} title - 웹툰 제목
 * @property {string} platform - 플랫폼 (예: 'naver', 'kakao')
 * @property {Array<EpisodeInfo>} episodes - 에피소드 정보 배열
 * @property {string} [thumbnailUrl] - 썸네일 URL
 * @property {string} [description] - 웹툰 설명
 * @property {string} [author] - 작가명
 * @property {string} [genre] - 장르
 * @property {string} [status] - 연재 상태 (예: 'ongoing', 'completed')
 */

/**
 * @typedef {Object} WebtoonCreateCommand
 * @property {string} webtoonId - 웹툰 ID
 * @property {string} title - 웹툰 제목
 * @property {string} platform - 플랫폼 (예: 'naver', 'kakao')
 * @property {Array<EpisodeInfo>} episodes - 에피소드 정보 배열
 * @property {string} [thumbnailUrl] - 썸네일 URL
 * @property {string} [description] - 웹툰 설명
 * @property {string} [author] - 작가명
 * @property {string} [genre] - 장르
 * @property {string} [status] - 연재 상태 (예: 'ongoing', 'completed')
 */

/**
 * @typedef {Object} EpisodeInfo
 * @property {string} episodeId - 에피소드 ID
 * @property {string} title - 에피소드 제목
 * @property {string} [thumbnailUrl] - 에피소드 썸네일 URL
 * @property {string} [uploadDate] - 업로드 날짜
 * @property {number} [episodeNumber] - 에피소드 번호
 * @property {string} [url] - 에피소드 URL
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
 * 웹툰 데이터를 Java에서 기대하는 형식으로 변환합니다.
 * @param {Object} rawData - 크롤링된 원본 데이터
 * @param {string} eventType - 이벤트 타입
 * @returns {WebtoonEpisodeUpdateCommand|WebtoonCreateCommand}
 */
export function formatWebtoonData(rawData, eventType) {
    // rawData가 이미 적절한 형식인지 확인
    if (rawData.webtoonId && rawData.title && rawData.platform) {
        return rawData;
    }
    
    // 크롤링된 데이터를 Java에서 기대하는 형식으로 변환
    const formattedData = {
        webtoonId: rawData.id || rawData.webtoonId || `webtoon_${Date.now()}`,
        title: rawData.title || rawData.name || 'Unknown Title',
        platform: rawData.platform || 'naver',
        episodes: rawData.episodes || rawData.chapters || [],
        thumbnailUrl: rawData.thumbnailUrl || rawData.thumbnail || rawData.image,
        description: rawData.description || rawData.summary,
        author: rawData.author || rawData.writer,
        genre: rawData.genre || rawData.category,
        status: rawData.status || 'ongoing'
    };
    
    // 에피소드 데이터 정규화
    if (formattedData.episodes && Array.isArray(formattedData.episodes)) {
        formattedData.episodes = formattedData.episodes.map(episode => ({
            episodeId: episode.id || episode.episodeId || `episode_${Date.now()}_${Math.random()}`,
            title: episode.title || episode.name || 'Unknown Episode',
            thumbnailUrl: episode.thumbnailUrl || episode.thumbnail || episode.image,
            uploadDate: episode.uploadDate || episode.date || episode.createdAt,
            episodeNumber: episode.episodeNumber || episode.number || episode.no,
            url: episode.url || episode.link,
            pricingType: episode.pricingType || 'FREE',
            daysUntilFree: episode.daysUntilFree || null,
            mobileUrl: episode.mobileUrl || null
        }));
    }
    
    return formattedData;
} 