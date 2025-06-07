/**
 * @typedef {'NAVER' | 'KAKAO' | 'LEZIN'} WebtoonPlatform
 */

/**
 * @typedef {Object} WebtoonData
 * @property {string} titleId - 웹툰의 titleId
 * @property {WebtoonPlatform} [platform='NAVER'] - 웹툰 플랫폼
 */

/**
 * @typedef {Object} WebtoonScrapResult
 * @property {string} title - 웹툰 제목
 * @property {WebtoonPlatform} platform - 웹툰 플랫폼
 */ 