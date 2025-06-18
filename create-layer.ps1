# PowerShell 인코딩 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Lambda Layer 생성을 위한 스크립트

# 빌드 환경 설정
$BUILD_DIR = "build"
$DIST_DIR = "$BUILD_DIR/dist"
$LAYER_DIR = "$BUILD_DIR/layer"
$LAMBDA_ZIP = "$BUILD_DIR/lambda.zip"
$LAYER_ZIP = "$BUILD_DIR/layer.zip"

# 이전 빌드 정리
if (Test-Path $LAYER_DIR) { Remove-Item -Recurse -Force $LAYER_DIR }
if (Test-Path $LAYER_ZIP) { Remove-Item -Force $LAYER_ZIP }

# build 디렉토리 생성 (없는 경우)
if (!(Test-Path $BUILD_DIR)) { New-Item -ItemType Directory -Force -Path $BUILD_DIR | Out-Null }

# Layer 디렉토리 생성
New-Item -ItemType Directory -Force -Path $LAYER_DIR/nodejs | Out-Null

Write-Host "=== Lambda Layer 생성 ===" -ForegroundColor Green

# Layer용 package.json 생성
$layerPackageJson = @"
{
    "name": "webtoon-crawler-layer",
    "version": "1.0.0",
    "description": "Lambda Layer for Webtoon Crawler dependencies",
    "dependencies": {
        "@aws-sdk/client-sqs": "^3.450.0",
        "@aws-sdk/client-ssm": "^3.450.0",
        "@sparticuz/chromium": "^109.0.5",
        "node-fetch": "^3.3.2",
        "puppeteer-core": "^21.0.0"
    }
}
"@
[System.IO.File]::WriteAllText("$PWD/$LAYER_DIR/nodejs/package.json", $layerPackageJson)

# 의존성 설치
Write-Host "Lambda Layer 의존성 설치 중..." -ForegroundColor Yellow
$currentLocation = Get-Location
Set-Location "$PWD/$LAYER_DIR/nodejs"
npm install --production --no-optional
Set-Location $currentLocation

# ZIP 파일 생성
Write-Host "Lambda Layer 패키지 생성 중..." -ForegroundColor Yellow
Compress-Archive -Path "$LAYER_DIR\*" -DestinationPath $LAYER_ZIP -Force

if (Test-Path $LAYER_ZIP) {
    $layerSize = [math]::Round((Get-Item $LAYER_ZIP).Length / 1MB, 2)
    Write-Host "Lambda Layer 생성 완료: $LAYER_ZIP" -ForegroundColor Green
    Write-Host "Layer 크기: $layerSize MB" -ForegroundColor Cyan
} else {
    Write-Host "Layer 생성 실패!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "다음 명령으로 Layer를 AWS에 업로드하세요:" -ForegroundColor Yellow
Write-Host "aws lambda publish-layer-version --layer-name webtoon-crawler-deps --description 'Dependencies for Webtoon Crawler' --zip-file fileb://$LAYER_ZIP --compatible-runtimes nodejs18.x --region ap-northeast-2" -ForegroundColor Cyan

Write-Host ""
Write-Host "=== Layer 생성 완료 ===" -ForegroundColor Green
Write-Host "Layer 위치: $LAYER_ZIP" -ForegroundColor Cyan 