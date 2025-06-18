/**
 * @typedef {'NAVER' | 'KAKAO' | 'LEZIN'} WebtoonPlatform
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