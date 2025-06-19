// 다양한 소스에서 환경변수를 취합하는 envLoader
export async function loadEnv({ sources = ['ssm', 'process', 'file'], ssmClient, filePath } = {}) {
    let env = {};
    if (sources.includes('ssm') && ssmClient) {
        const ssmVars = await ssmClient.getAllEnvironmentVariables();
        env = { ...env, ...ssmVars };
    }
    if (sources.includes('process')) {
        env = { ...env, ...process.env };
    }
    if (sources.includes('file') && filePath) {
        // 파일에서 환경변수 로딩 (예: .env.json)
        try {
            const fileVars = JSON.parse(require('fs').readFileSync(filePath, 'utf-8'));
            env = { ...env, ...fileVars };
        } catch (e) {
            // 파일이 없거나 파싱 실패시 무시
        }
    }
    return env;
} 