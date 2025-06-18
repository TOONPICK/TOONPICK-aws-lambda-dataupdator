# PowerShell 스크립트 - Lambda Layer 생성
# UTF-8 인코딩 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=== Lambda Layer 생성 시작 ===" -ForegroundColor Green

# 작업 디렉토리 설정
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# 빌드 디렉토리 설정
$BUILD_DIR = "build"
$LAYER_DIR = "$BUILD_DIR/layer"
$LAYER_ZIP = "$BUILD_DIR/layer.zip"

# 이전 빌드 정리
if (Test-Path $LAYER_DIR) {
    Write-Host "기존 Layer 디렉토리 제거 중..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $LAYER_DIR
}
if (Test-Path $LAYER_ZIP) {
    Remove-Item -Force $LAYER_ZIP
}

# 빌드 디렉토리 생성
if (!(Test-Path $BUILD_DIR)) {
    New-Item -ItemType Directory -Force -Path $BUILD_DIR | Out-Null
}

# Layer 디렉토리 생성
$nodeModulesDir = "$LAYER_DIR/nodejs"
New-Item -ItemType Directory -Force -Path $nodeModulesDir | Out-Null

Write-Host "Layer 디렉토리 생성 완료: $nodeModulesDir" -ForegroundColor Green

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

[System.IO.File]::WriteAllText("$nodeModulesDir/package.json", $layerPackageJson)
Write-Host "Layer용 package.json 생성 완료" -ForegroundColor Green

# 의존성 설치
Write-Host "의존성 설치 중..." -ForegroundColor Yellow
$currentLocation = Get-Location
Set-Location $nodeModulesDir

try {
    npm install --production --no-optional --no-audit --no-fund
    Write-Host "의존성 설치 완료" -ForegroundColor Green
} catch {
    Write-Host "의존성 설치 실패: $_" -ForegroundColor Red
    Set-Location $currentLocation
    exit 1
}

Set-Location $currentLocation

# Chromium 관련 파일들 확인
Write-Host "Chromium 관련 파일 확인 중..." -ForegroundColor Yellow
$chromiumPath = "$nodeModulesDir/node_modules/@sparticuz/chromium"
if (Test-Path $chromiumPath) {
    Write-Host "Chromium 파일 발견: $chromiumPath" -ForegroundColor Green
    
    # Chromium 실행 파일 확인
    $chromiumBinPath = "$chromiumPath/bin"
    if (Test-Path $chromiumBinPath) {
        $binFiles = Get-ChildItem $chromiumBinPath -Recurse
        Write-Host "Chromium 바이너리 파일 수: $($binFiles.Count)" -ForegroundColor Green
    }
} else {
    Write-Host "경고: Chromium 파일을 찾을 수 없습니다!" -ForegroundColor Yellow
}

# 불필요한 파일들 제거
Write-Host "불필요한 파일 제거 중..." -ForegroundColor Yellow
$removePatterns = @(
    "node_modules/*/test*",
    "node_modules/*/tests*",
    "node_modules/*/docs*",
    "node_modules/*/examples*",
    "node_modules/*/CHANGELOG*",
    "node_modules/*/README*",
    "node_modules/*/LICENSE*",
    "node_modules/*/.git*",
    "node_modules/*/coverage*",
    "node_modules/*/.nyc_output*"
)

foreach ($pattern in $removePatterns) {
    $patternPath = "$nodeModulesDir/$pattern"
    Get-ChildItem -Path $patternPath -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
}

# Layer 크기 확인
$layerSize = (Get-ChildItem -Path $nodeModulesDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Layer 크기: $([math]::Round($layerSize, 2)) MB" -ForegroundColor Green

# ZIP 파일 생성
Write-Host "ZIP 파일 생성 중: $LAYER_ZIP" -ForegroundColor Yellow
Compress-Archive -Path "$LAYER_DIR/*" -DestinationPath $LAYER_ZIP -Force

if (Test-Path $LAYER_ZIP) {
    $zipSize = [math]::Round((Get-Item $LAYER_ZIP).Length / 1MB, 2)
    Write-Host "ZIP 파일 크기: $zipSize MB" -ForegroundColor Green
} else {
    Write-Host "ZIP 파일 생성 실패!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Layer 생성 완료 ===" -ForegroundColor Green
Write-Host "생성된 파일: $LAYER_ZIP" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 명령으로 Layer를 AWS에 업로드하세요:" -ForegroundColor Yellow
Write-Host "aws lambda publish-layer-version --layer-name webtoon-crawler-deps --description 'Dependencies for Webtoon Crawler' --zip-file fileb://$LAYER_ZIP --compatible-runtimes nodejs18.x --region ap-northeast-2" -ForegroundColor Cyan 