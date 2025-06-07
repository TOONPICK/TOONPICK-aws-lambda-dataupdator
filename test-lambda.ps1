# Lambda 함수 테스트를 위한 PowerShell 스크립트

# UTF-8 인코딩 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Lambda 환경 변수 설정
$env:AWS_LAMBDA_FUNCTION_NAME = "webtoon-crawler"
$env:AWS_LAMBDA_FUNCTION_VERSION = "1"
$env:AWS_LAMBDA_FUNCTION_MEMORY_SIZE = "2048"
$env:AWS_REGION = "ap-northeast-2"

# 테스트 실행
node test.js

# 환경 변수 정리
Remove-Item Env:\AWS_LAMBDA_FUNCTION_NAME
Remove-Item Env:\AWS_LAMBDA_FUNCTION_VERSION
Remove-Item Env:\AWS_LAMBDA_FUNCTION_MEMORY_SIZE
Remove-Item Env:\AWS_REGION

$body = @{
    url = "https://comic.naver.com/webtoon/list?titleId=747271"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "Lambda 함수 테스트를 시작합니다..."
Write-Host "URL: https://comic.naver.com/webtoon/list?titleId=747271"

try {
    Start-Sleep -Seconds 2  # Lambda 컨테이너가 완전히 시작될 때까지 대기

    $response = Invoke-RestMethod `
        -Uri "http://localhost:9000/2015-03-31/functions/function/invocations" `
        -Method Post `
        -Body $body `
        -Headers $headers `
        -ContentType "application/json"

    Write-Host "응답 내용:"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "오류 발생: $_"
    Write-Host "상세 오류: $($_.Exception.Message)"
} 