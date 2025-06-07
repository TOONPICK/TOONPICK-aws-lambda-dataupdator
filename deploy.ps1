# 이전 빌드 정리
if (Test-Path dist) { Remove-Item -Recurse -Force dist }
if (Test-Path lambda.zip) { Remove-Item -Force lambda.zip }

# 배포용 디렉토리 생성
New-Item -ItemType Directory -Path dist

# 소스 파일 복사
Copy-Item -Path index.js, crawler.js, package.json -Destination dist
Copy-Item -Recurse -Path strategies, factories -Destination dist

# 프로덕션 의존성 설치
Push-Location dist
npm install --production
Pop-Location

# ZIP 파일 생성
Compress-Archive -Path dist\* -DestinationPath lambda.zip 