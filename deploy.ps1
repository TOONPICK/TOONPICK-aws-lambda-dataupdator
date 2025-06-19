# PowerShell 인코딩 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# 빌드 환경 설정
$BUILD_DIR = "build"
$DIST_DIR = "$BUILD_DIR/dist"
$LAYER_DIR = "$BUILD_DIR/layer"
$LAMBDA_ZIP = "$BUILD_DIR/lambda.zip"
$LAYER_ZIP = "$BUILD_DIR/layer.zip"

# 이전 빌드 정리
if (Test-Path $BUILD_DIR) { Remove-Item -Recurse -Force $BUILD_DIR }
New-Item -ItemType Directory -Force -Path $BUILD_DIR | Out-Null

Write-Host "=== Lambda 함수 배포 패키지 생성 ===" -ForegroundColor Green

# 배포용 디렉토리 생성
New-Item -ItemType Directory -Force -Path $DIST_DIR/src/browsers | Out-Null
New-Item -ItemType Directory -Force -Path $DIST_DIR/src/config | Out-Null
New-Item -ItemType Directory -Force -Path $DIST_DIR/src/core | Out-Null
New-Item -ItemType Directory -Force -Path $DIST_DIR/src/scrapers | Out-Null
New-Item -ItemType Directory -Force -Path $DIST_DIR/src/scrapers/platforms | Out-Null
New-Item -ItemType Directory -Force -Path $DIST_DIR/src/types | Out-Null
New-Item -ItemType Directory -Force -Path $DIST_DIR/src/utils | Out-Null
New-Item -ItemType Directory -Force -Path $DIST_DIR/src/collectors | Out-Null

# Lambda용 package.json 생성 (BOM 없이) - 의존성 제거
$packageJson = @"
{
    "name": "webtoon-web-crawler",
    "version": "1.0.0",
    "description": "Webtoon web crawler using Puppeteer",
    "main": "index.js",
    "type": "module"
}
"@
[System.IO.File]::WriteAllText("$PWD/$DIST_DIR/package.json", $packageJson)

# CommonJS 브릿지 파일 생성
$indexCjs = @"
// index.cjs - CommonJS to ES Module bridge
module.exports.handler = async (event) => {
    const { handler } = await import('./index.js');
    return handler(event);
};
"@
[System.IO.File]::WriteAllText("$PWD/$DIST_DIR/index.cjs", $indexCjs)

# 소스 파일 복사
Write-Host "소스 파일 복사 중..." -ForegroundColor Yellow
Copy-Item -Path index.js -Destination $DIST_DIR
Copy-Item -Path src/browsers/* -Destination $DIST_DIR/src/browsers
Copy-Item -Path src/config/* -Destination $DIST_DIR/src/config
Copy-Item -Path src/core/* -Destination $DIST_DIR/src/core
Copy-Item -Path src/scrapper/*.js -Destination $DIST_DIR/src/scrapper
Copy-Item -Path src/scrapper/platforms/* -Destination $DIST_DIR/src/scrapper/platforms
Copy-Item -Path src/types/* -Destination $DIST_DIR/src/types
Copy-Item -Path src/utils/* -Destination $DIST_DIR/src/utils
Copy-Item -Recurse -Path src/env -Destination $DIST_DIR/src
Copy-Item -Recurse -Path src/aws -Destination $DIST_DIR/src
Copy-Item -Recurse -Path src/notification -Destination $DIST_DIR/src
Copy-Item -Path src/collectors/* -Destination $DIST_DIR/src/collectors
Copy-Item -Path src/scrapers/* -Destination $DIST_DIR/src/scrapers

# ZIP 파일 생성 (node_modules 제외)
Write-Host "Lambda 배포 패키지 생성 중..." -ForegroundColor Yellow
Compress-Archive -Path $DIST_DIR\* -DestinationPath $LAMBDA_ZIP -Force

$lambdaSize = [math]::Round((Get-Item $LAMBDA_ZIP).Length / 1KB, 2)
Write-Host "Lambda 함수 배포 패키지 생성 완료: $LAMBDA_ZIP" -ForegroundColor Green
Write-Host "패키지 크기: $lambdaSize KB" -ForegroundColor Cyan
Write-Host "참고: 의존성은 Lambda Layer를 통해 제공되어야 합니다." -ForegroundColor Yellow

Write-Host ""
Write-Host "=== 빌드 완료 ===" -ForegroundColor Green
Write-Host "빌드 결과 위치: $BUILD_DIR" -ForegroundColor Cyan
Write-Host "Lambda 함수: $LAMBDA_ZIP" -ForegroundColor Cyan
Write-Host "Layer 생성: npm run build:layer" -ForegroundColor Yellow 