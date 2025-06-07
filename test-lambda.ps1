# Lambda 함수 테스트를 위한 PowerShell 스크립트

# UTF-8 인코딩 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

$body = @{
    url = "https://comic.naver.com/webtoon/list?titleId=747271"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "Lambda 함수 테스트를 시작합니다..."
Write-Host "URL: https://comic.naver.com/webtoon/list?titleId=747271"

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:9000/2015-03-31/functions/function/invocations" `
        -Method Post `
        -Body $body `
        -Headers $headers `
        -UseBasicParsing

    Write-Host "응답 상태: $($response.StatusCode)"
    Write-Host "응답 내용:"
    $responseContent = $response.Content | ConvertFrom-Json
    $responseContent | ConvertTo-Json -Depth 10
} catch {
    Write-Host "오류 발생: $_"
    Write-Host "상세 오류: $($_.Exception.Message)"
} 