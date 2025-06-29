/**
 * Repository 인터페이스
 * 모든 Repository 구현체가 따라야 할 메서드들을 정의합니다.
 * @interface
 */
export class RepositoryInterface {
    /**
     * 데이터를 저장합니다.
     * @param {any} data - 저장할 데이터
     * @param {string} filename - 파일명
     * @param {Object} options - 추가 옵션
     * @returns {Promise<string>} 저장된 파일의 전체 경로
     * @throws {Error} 저장 실패 시 에러
     */
    async save(data, filename, options = {}) {
        throw new Error('save 메서드를 구현해야 합니다.');
    }

    /**
     * 여러 데이터를 개별 파일로 저장합니다.
     * @param {Array<{data: any, filename: string}>} items - 저장할 데이터와 파일명 배열
     * @param {Object} options - 추가 옵션
     * @returns {Promise<Array<string>>} 저장된 파일들의 전체 경로 배열
     */
    async saveMultiple(items, options = {}) {
        throw new Error('saveMultiple 메서드를 구현해야 합니다.');
    }

    /**
     * 데이터를 타임스탬프가 포함된 파일명으로 저장합니다.
     * @param {any} data - 저장할 데이터
     * @param {string} prefix - 파일명 접두사
     * @param {Object} options - 추가 옵션
     * @returns {Promise<string>} 저장된 파일의 전체 경로
     */
    async saveWithTimestamp(data, prefix = 'data', options = {}) {
        throw new Error('saveWithTimestamp 메서드를 구현해야 합니다.');
    }

    /**
     * 저장 설정을 업데이트합니다.
     * @param {Object} options - 업데이트할 옵션
     */
    updateOptions(options) {
        throw new Error('updateOptions 메서드를 구현해야 합니다.');
    }

    /**
     * 현재 저장 설정을 반환합니다.
     * @returns {Object} 현재 설정
     */
    getOptions() {
        throw new Error('getOptions 메서드를 구현해야 합니다.');
    }

    /**
     * 저장된 데이터를 읽어옵니다.
     * @param {string} filename - 파일명
     * @param {Object} options - 추가 옵션
     * @returns {Promise<any>} 읽어온 데이터
     */
    async load(filename, options = {}) {
        throw new Error('load 메서드를 구현해야 합니다.');
    }

    /**
     * 파일이 존재하는지 확인합니다.
     * @param {string} filename - 파일명
     * @returns {Promise<boolean>} 파일 존재 여부
     */
    async exists(filename) {
        throw new Error('exists 메서드를 구현해야 합니다.');
    }

    /**
     * 파일을 삭제합니다.
     * @param {string} filename - 파일명
     * @returns {Promise<boolean>} 삭제 성공 여부
     */
    async delete(filename) {
        throw new Error('delete 메서드를 구현해야 합니다.');
    }

    /**
     * 저장소의 모든 파일 목록을 반환합니다.
     * @param {Object} options - 추가 옵션
     * @returns {Promise<Array<string>>} 파일 목록
     */
    async listFiles(options = {}) {
        throw new Error('listFiles 메서드를 구현해야 합니다.');
    }
} 