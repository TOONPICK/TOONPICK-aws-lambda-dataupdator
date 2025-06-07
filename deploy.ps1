# 이전 빌드 정리
if (Test-Path dist) { Remove-Item -Recurse -Force dist }
if (Test-Path lambda.zip) { Remove-Item -Force lambda.zip }

# 배포용 디렉토리 생성
New-Item -ItemType Directory -Force -Path dist/src/browsers
New-Item -ItemType Directory -Force -Path dist/src/config
New-Item -ItemType Directory -Force -Path dist/src/core
New-Item -ItemType Directory -Force -Path dist/src/scrapper
New-Item -ItemType Directory -Force -Path dist/src/types
New-Item -ItemType Directory -Force -Path dist/src/utils

# Lambda용 package.json 생성 (BOM 없이)
$packageJson = @"
{
    "name": "webtoon-web-crawler",
    "version": "1.0.0",
    "type": "module"
}
"@
[System.IO.File]::WriteAllText("$PWD/dist/package.json", $packageJson)

# CommonJS 브릿지 파일 생성
$indexCjs = @"
// index.cjs - CommonJS to ES Module bridge
module.exports.handler = async (event) => {
    const { handler } = await import('./index.js');
    return handler(event);
};
"@
[System.IO.File]::WriteAllText("$PWD/dist/index.cjs", $indexCjs)

# 소스 파일 복사
Copy-Item -Path index.js -Destination dist
Copy-Item -Path src/browsers/* -Destination dist/src/browsers
Copy-Item -Path src/config/* -Destination dist/src/config
Copy-Item -Path src/core/* -Destination dist/src/core
Copy-Item -Path src/scrapper/* -Destination dist/src/scrapper
Copy-Item -Path src/types/* -Destination dist/src/types
Copy-Item -Path src/utils/* -Destination dist/src/utils

# ZIP 파일 생성 (node_modules 제외)
Compress-Archive -Path dist\* -DestinationPath lambda.zip 