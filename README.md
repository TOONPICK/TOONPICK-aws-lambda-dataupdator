# Webtoon Web Crawler (AWS Lambda)

AWS Lambda를 사용한 웹툰 크롤러 데모 프로젝트입니다.

## 설치 방법

```bash
npm install
```

## 주요 의존성

- chrome-aws-lambda: AWS Lambda 환경에서 Chromium을 실행하기 위한 패키지
- puppeteer-core: 웹 크롤링을 위한 헤드리스 브라우저 제어 라이브러리

## Lambda 설정 요구사항

- 메모리: 최소 512MB (권장 1600MB 이상)
- 타임아웃: 최소 30초 권장
- Node.js 런타임: 14.x 이상

## 기능

- 네이버 웹툰 메인 페이지 크롤링
- 오늘의 웹툰 목록 수집
  - 제목
  - URL

## 주의사항

- AWS Lambda에서 실행 시 충분한 메모리를 할당해야 합니다.
- 웹 크롤링 시 해당 웹사이트의 이용약관을 준수해야 합니다. 