# Webtoon Web Crawler JS

## 개요

AWS Lambda에서 실행되는 웹툰 크롤링 시스템입니다. Puppeteer를 사용해 네이버 웹툰 데이터를 수집하고, SQS를 통해 작업을 처리합니다.

현재 네이버 웹툰을 지원하며, 새로운 플랫폼을 쉽게 추가할 수 있는 구조로 설계되었습니다. 로컬 개발과 Lambda 배포 환경 모두에서 동작합니다.

## 시스템 아키텍처

### 전체 구조도
```
SQS Message → Lambda Function → Crawler Engine → Browser → Scraper → Data Collection
     ↓              ↓               ↓              ↓         ↓           ↓
알림 전송 ← JSON 저장소 ← 결과 집계 ← 컬렉터 실행 ← 웹페이지 ← 플랫폼별 스크래핑
```

### 주요 컴포넌트

**Crawler** - 크롤링 작업을 관리하고 브라우저 인스턴스를 제어합니다.

**Browser 추상화** - Lambda(@sparticuz/chromium)와 로컬(puppeteer) 환경을 통합된 인터페이스로 처리합니다.

**Collector 시스템** - 수집 유형별로 작업을 분리합니다:
- AllWebtoonCollector: 전체 웹툰 리스트
- WebtoonContentCollector: 특정 웹툰 에피소드
- WebtoonUpdateCollector: 업데이트 정보  
- NewWebtoonCollector: 신규 웹툰

**Scraper 시스템** - 플랫폼별 스크래핑을 담당합니다. 현재 NaverScraper가 구현되어 있으며, ScraperFactory를 통해 관리됩니다.

**JsonRepository** - 타임스탬프가 포함된 JSON 형태로 데이터를 저장합니다.

## 개발 가이드

### 요구사항
- Node.js 18.0.0 이상
- npm 또는 yarn  
- AWS CLI (배포시)
- AWS 계정 및 IAM 권한

### 설치

```bash
git clone <repository-url>
cd Webtoon-Web-Crawler-Js
npm install

# 환경 변수 설정 (로컬 개발용)
cp env.example .env
```

### 명령어

**개발 및 테스트**
```bash
npm start                             # 로컬 실행
node test/test-all-webtoon.js         # 전체 웹툰 수집 테스트
node test/test-json-repository.js     # JSON 저장소 테스트
node sample/all-webtoon.js            # 샘플 실행
```

**빌드 및 배포**
```bash
npm run build              # Lambda 빌드 (PowerShell)
npm run build:unix         # Lambda 빌드 (Unix)
npm run build:layer        # Layer 생성
npm run build:all          # 전체 빌드
npm run deploy:layer       # Layer 배포
```

### 환경 변수

로컬 개발시 `.env` 파일을 사용하고, 프로덕션에서는 AWS Parameter Store를 사용합니다.

```bash
# .env 파일 예시
PARAMETER_STORE_PREFIX=/TOONPICK/prod/
AWS_REGION=ap-northeast-2
NODE_ENV=development
```

## 사용법

### SQS 이벤트 타입

```json
// 모든 웹툰 리스트 수집
{"eventType": "CRAWL_WEBTOON_ALL", "data": {}}

// 특정 웹툰 에피소드 수집
{
  "eventType": "CRAWL_WEBTOON_EPISODE", 
  "data": {
    "id": 832557,
    "url": "https://comic.naver.com/webtoon/list?titleId=832557",
    "platform": "NAVER"
  }
}

// 신규 웹툰 수집  
{"eventType": "CRAWL_WEBTOON_NEW", "data": {}}
```

### 로컬 실행

```javascript
import { Crawler } from './src/core/crawler.js';
import { LocalBrowser } from './src/browsers/localBrowser.js';

const crawler = new Crawler(new LocalBrowser());
const result = await crawler.execute({
  requestId: 'test-1',
  eventType: 'CRAWL_WEBTOON_ALL',
  data: {}
});
```

## 코드 구조

```
src/
├── core/crawler.js           # 크롤링 엔진
├── browsers/                 # 브라우저 추상화
├── collectors/               # 수집 타입별 처리
├── scrapers/                 # 플랫폼별 스크래핑
├── repository/               # 데이터 저장
├── aws/                      # AWS 클라이언트
└── notification/             # 알림 시스템

test/                         # 테스트 파일
sample/                       # 예제 코드
```

### 확장 방법

**새 플랫폼 추가**
1. `ScrapingImplementor`를 상속한 스크래퍼 구현
2. `ScraperFactory`에 등록

**새 컬렉터 타입 추가**  
1. `ContentCollector`를 상속한 컬렉터 구현
2. `Crawler` 클래스의 collectors Map에 등록

## 기술 스택

**주요 의존성**
- puppeteer-core: 웹 스크래핑
- @sparticuz/chromium: Lambda용 Chromium  
- @aws-sdk/client-sqs: SQS 클라이언트
- @aws-sdk/client-ssm: Parameter Store

**AWS 구성**
- Lambda: Node.js 18.x, 최소 512MB 메모리
- SQS: 작업 큐 관리
- Parameter Store: 환경 변수 관리  
- Slack: 알림 전송

**데이터 저장**
JSON 파일 형태로 저장하며, 타임스탬프와 메타데이터가 자동 포함됩니다.

## 제한사항

- 현재 네이버 웹툰만 지원
- Lambda 실행 시간 최대 15분
- Chromium으로 인한 높은 메모리 사용량
- 동적 콘텐츠 렌더링으로 인한 처리 시간 증가

## 문제 해결

**브라우저 실행 실패**: Lambda 메모리 설정(최소 512MB) 및 Chromium 버전 확인  
**환경변수 오류**: IAM 권한 및 Parameter Store 경로 확인  
**크롤링 타임아웃**: Lambda 타임아웃 설정 및 대상 사이트 응답 시간 확인