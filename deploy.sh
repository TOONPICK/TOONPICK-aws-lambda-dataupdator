#!/bin/bash

# 이전 빌드 정리
rm -rf dist
rm -f lambda.zip

# 배포용 디렉토리 생성
mkdir dist

# 소스 파일 복사
cp -r index.js crawler.js strategies factories package.json dist/

# 프로덕션 의존성 설치
cd dist
npm install --production

# ZIP 파일 생성
zip -r ../lambda.zip . 