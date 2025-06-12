import fs from 'fs';
import path from 'path';

export class FileUtils {
    /**
     * HTML 파일을 저장합니다.
     * @param {string} html - 저장할 HTML 내용
     * @param {string} platform - 플랫폼 이름
     * @param {string} titleId - 웹툰 ID
     * @returns {Promise<string>} 저장된 파일 경로
     */
    static async saveHtmlFile(html, platform, titleId) {
        // html 디렉토리가 없으면 생성
        const htmlDir = path.join(process.cwd(), 'html');
        if (!fs.existsSync(htmlDir)) {
            fs.mkdirSync(htmlDir);
        }

        // 플랫폼별 디렉토리 생성
        const platformDir = path.join(htmlDir, platform.toLowerCase());
        if (!fs.existsSync(platformDir)) {
            fs.mkdirSync(platformDir);
        }

        // 현재 시간을 파일명에 포함
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${titleId}_${timestamp}.html`;
        const filePath = path.join(platformDir, fileName);

        // HTML 파일 저장
        await fs.promises.writeFile(filePath, html, 'utf8');
        console.log(`HTML이 저장되었습니다: ${filePath}`);

        return filePath;
    }
} 