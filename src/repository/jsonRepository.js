import { writeFile, mkdir, readFile, unlink, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { RepositoryInterface } from './repositoryInterface.js';

/**
 * JSON 형태로 데이터를 저장하는 Repository 클래스
 * @extends RepositoryInterface
 */
export class JsonRepository extends RepositoryInterface {
    /**
     * @param {Object} options - 저장 옵션
     * @param {string} options.basePath - 기본 저장 경로
     * @param {boolean} options.createDirectory - 디렉토리 자동 생성 여부 (기본값: true)
     * @param {boolean} options.prettyPrint - JSON을 보기 좋게 포맷팅 여부 (기본값: true)
     * @param {string} options.encoding - 파일 인코딩 (기본값: 'utf8')
     * @param {boolean} options.overwrite - 기존 파일 덮어쓰기 여부 (기본값: true)
     */
    constructor(options = {}) {
        super();
        this.basePath = options.basePath || './data';
        this.createDirectory = options.createDirectory !== false; // 기본값: true
        this.prettyPrint = options.prettyPrint !== false; // 기본값: true
        this.encoding = options.encoding || 'utf8';
        this.overwrite = options.overwrite !== false; // 기본값: true
    }

    /**
     * 데이터를 JSON 파일로 저장합니다.
     * @param {any} data - 저장할 데이터
     * @param {string} filename - 파일명 (확장자 포함 또는 제외)
     * @param {Object} options - 추가 옵션 (기본 설정을 덮어씀)
     * @returns {Promise<string>} 저장된 파일의 전체 경로
     * @throws {Error} 저장 실패 시 에러
     */
    async save(data, filename, options = {}) {
        try {
            // 파일명에 .json 확장자가 없으면 추가
            const jsonFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
            
            // 전체 파일 경로 생성
            const fullPath = join(this.basePath, jsonFilename);
            
            // 디렉토리 생성 (필요한 경우)
            if (this.createDirectory || options.createDirectory) {
                await this.#ensureDirectoryExists(dirname(fullPath));
            }
            
            // 기존 파일 존재 여부 확인
            if (!this.overwrite && !options.overwrite && existsSync(fullPath)) {
                throw new Error(`파일이 이미 존재합니다: ${fullPath}`);
            }
            
            // JSON 문자열 생성
            const jsonString = this.prettyPrint || options.prettyPrint 
                ? JSON.stringify(data, null, 2) 
                : JSON.stringify(data);
            
            // 파일 저장
            await writeFile(fullPath, jsonString, {
                encoding: options.encoding || this.encoding
            });
            
            console.log(`데이터가 성공적으로 저장되었습니다: ${fullPath}`);
            return fullPath;
            
        } catch (error) {
            console.error('데이터 저장 실패:', error);
            throw new Error(`데이터 저장 실패: ${error.message}`);
        }
    }

    /**
     * 여러 데이터를 개별 파일로 저장합니다.
     * @param {Array<{data: any, filename: string}>} items - 저장할 데이터와 파일명 배열
     * @param {Object} options - 추가 옵션
     * @returns {Promise<Array<string>>} 저장된 파일들의 전체 경로 배열
     */
    async saveMultiple(items, options = {}) {
        const savedPaths = [];
        
        for (const item of items) {
            try {
                const path = await this.save(item.data, item.filename, options);
                savedPaths.push(path);
            } catch (error) {
                console.error(`파일 저장 실패 (${item.filename}):`, error);
                throw error;
            }
        }
        
        return savedPaths;
    }

    /**
     * 데이터를 타임스탬프가 포함된 파일명으로 저장합니다.
     * @param {any} data - 저장할 데이터
     * @param {string} prefix - 파일명 접두사
     * @param {Object} options - 추가 옵션
     * @returns {Promise<string>} 저장된 파일의 전체 경로
     */
    async saveWithTimestamp(data, prefix = 'data', options = {}) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${prefix}_${timestamp}.json`;
        return this.save(data, filename, options);
    }

    /**
     * 저장된 JSON 파일을 읽어옵니다.
     * @param {string} filename - 파일명
     * @param {Object} options - 추가 옵션
     * @returns {Promise<any>} 읽어온 데이터
     */
    async load(filename, options = {}) {
        try {
            // 파일명에 .json 확장자가 없으면 추가
            const jsonFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
            const fullPath = join(this.basePath, jsonFilename);
            
            // 파일 존재 확인
            if (!existsSync(fullPath)) {
                throw new Error(`파일이 존재하지 않습니다: ${fullPath}`);
            }
            
            // 파일 읽기
            const fileContent = await readFile(fullPath, {
                encoding: options.encoding || this.encoding
            });
            
            // JSON 파싱
            const data = JSON.parse(fileContent);
            console.log(`데이터를 성공적으로 읽어왔습니다: ${fullPath}`);
            return data;
            
        } catch (error) {
            console.error('데이터 읽기 실패:', error);
            throw new Error(`데이터 읽기 실패: ${error.message}`);
        }
    }

    /**
     * 파일이 존재하는지 확인합니다.
     * @param {string} filename - 파일명
     * @returns {Promise<boolean>} 파일 존재 여부
     */
    async exists(filename) {
        const jsonFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
        const fullPath = join(this.basePath, jsonFilename);
        return existsSync(fullPath);
    }

    /**
     * 파일을 삭제합니다.
     * @param {string} filename - 파일명
     * @returns {Promise<boolean>} 삭제 성공 여부
     */
    async delete(filename) {
        try {
            const jsonFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
            const fullPath = join(this.basePath, jsonFilename);
            
            if (!existsSync(fullPath)) {
                console.warn(`삭제할 파일이 존재하지 않습니다: ${fullPath}`);
                return false;
            }
            
            await unlink(fullPath);
            console.log(`파일이 성공적으로 삭제되었습니다: ${fullPath}`);
            return true;
            
        } catch (error) {
            console.error('파일 삭제 실패:', error);
            throw new Error(`파일 삭제 실패: ${error.message}`);
        }
    }

    /**
     * 저장소의 모든 JSON 파일 목록을 반환합니다.
     * @param {Object} options - 추가 옵션
     * @returns {Promise<Array<string>>} 파일 목록
     */
    async listFiles(options = {}) {
        try {
            // 디렉토리 존재 확인
            if (!existsSync(this.basePath)) {
                console.warn(`저장소 디렉토리가 존재하지 않습니다: ${this.basePath}`);
                return [];
            }
            
            const files = await readdir(this.basePath);
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            
            console.log(`저장소에서 ${jsonFiles.length}개의 JSON 파일을 찾았습니다.`);
            return jsonFiles;
            
        } catch (error) {
            console.error('파일 목록 읽기 실패:', error);
            throw new Error(`파일 목록 읽기 실패: ${error.message}`);
        }
    }

    /**
     * 디렉토리가 존재하는지 확인하고, 없으면 생성합니다.
     * @param {string} directoryPath - 디렉토리 경로
     * @private
     */
    async #ensureDirectoryExists(directoryPath) {
        if (!existsSync(directoryPath)) {
            await mkdir(directoryPath, { recursive: true });
            console.log(`디렉토리가 생성되었습니다: ${directoryPath}`);
        }
    }

    /**
     * 저장 설정을 업데이트합니다.
     * @param {Object} options - 업데이트할 옵션
     */
    updateOptions(options) {
        Object.assign(this, options);
    }

    /**
     * 현재 저장 설정을 반환합니다.
     * @returns {Object} 현재 설정
     */
    getOptions() {
        return {
            basePath: this.basePath,
            createDirectory: this.createDirectory,
            prettyPrint: this.prettyPrint,
            encoding: this.encoding,
            overwrite: this.overwrite
        };
    }
} 