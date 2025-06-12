/**
 * HTML 포맷팅을 위한 유틸리티 클래스
 */
export class HtmlFormatter {
    /**
     * HTML을 포맷팅합니다.
     * @param {string} html - 포맷팅할 HTML 문자열
     * @returns {Promise<string>} 포맷팅된 HTML 문자열
     */
    static async format(html) {
        try {
            // prettier가 설치되어 있는 경우에만 사용
            const prettier = await import('prettier');
            return await prettier.format(html, {
                parser: 'html',
                printWidth: 120,
                tabWidth: 4,
                useTabs: false,
                htmlWhitespaceSensitivity: 'css'
            });
        } catch (error) {
            // prettier가 없는 경우 기본적인 들여쓰기만 적용
            return this.basicFormat(html);
        }
    }

    /**
     * prettier 없이 기본적인 들여쓰기만 적용하는 포맷팅
     * @param {string} html - 포맷팅할 HTML 문자열
     * @returns {string} 포맷팅된 HTML 문자열
     */
    static basicFormat(html) {
        let formatted = '';
        let indent = 0;
        const lines = html.split(/>[\\s]*/);
        
        for (let line of lines) {
            if (line.includes('</')) {
                indent--;
            }
            
            formatted += '    '.repeat(Math.max(0, indent)) + line.trim() + '>\n';
            
            if (line.includes('<') && !line.includes('</') && !line.includes('/>')) {
                indent++;
            }
        }
        
        return formatted;
    }
} 