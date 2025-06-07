# Lambda 함수 테스트를 위한 PowerShell 스크립트

# PowerShell 스크립트의 인코딩을 UTF-8로 설정
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

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