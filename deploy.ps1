# 이전 빌드 정리
if (Test-Path dist) { Remove-Item -Recurse -Force dist }
if (Test-Path lambda.zip) { Remove-Item -Force lambda.zip }

# 배포용 디렉토리 생성
New-Item -ItemType Directory -Path dist
New-Item -ItemType Directory -Path dist/browsers
New-Item -ItemType Directory -Path dist/factories
New-Item -ItemType Directory -Path dist/strategies

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

# 소스 파일 복사 (Lambda에 필요한 파일들만)
Copy-Item -Path index.js -Destination dist
Copy-Item -Path crawler.js -Destination dist
Copy-Item -Path browsers/browserTypes.js -Destination dist/browsers
Copy-Item -Path browsers/lambdaBrowserType.js -Destination dist/browsers
Copy-Item -Path factories/browserFactory.js -Destination dist/factories
Copy-Item -Path strategies/crawlStrategy.js -Destination dist/strategies
Copy-Item -Path strategies/webtoonTitleStrategy.js -Destination dist/strategies

# ZIP 파일 생성 (node_modules 제외)
Compress-Archive -Path dist\* -DestinationPath lambda.zip 