#!/bin/bash

# 빌드 환경 설정
BUILD_DIR="build"
DIST_DIR="$BUILD_DIR/dist"
LAYER_DIR="$BUILD_DIR/layer"
LAMBDA_ZIP="$BUILD_DIR/lambda.zip"
LAYER_ZIP="$BUILD_DIR/layer.zip"

# 이전 빌드 정리
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

echo "=== Lambda 함수 배포 패키지 생성 ==="

# 배포용 디렉토리 생성
mkdir -p $DIST_DIR/src/browsers
mkdir -p $DIST_DIR/src/config
mkdir -p $DIST_DIR/src/core
mkdir -p $DIST_DIR/src/scrapper
mkdir -p $DIST_DIR/src/scrapper/platforms
mkdir -p $DIST_DIR/src/types
mkdir -p $DIST_DIR/src/utils
mkdir -p $DIST_DIR/src/aws
mkdir -p $DIST_DIR/src/notification
mkdir -p $DIST_DIR/src/env

# Lambda용 package.json 생성 (의존성 제거)
cat > $DIST_DIR/package.json << 'EOF'
{
    "name": "webtoon-web-crawler",
    "version": "1.0.0",
    "description": "Webtoon web crawler using Puppeteer",
    "main": "index.js",
    "type": "module"
}
EOF

# CommonJS 브릿지 파일 생성
cat > $DIST_DIR/index.cjs << 'EOF'
// index.cjs - CommonJS to ES Module bridge
module.exports.handler = async (event) => {
    const { handler } = await import('./index.js');
    return handler(event);
};
EOF

# 소스 파일 복사
echo "소스 파일 복사 중..."
cp index.js $DIST_DIR/
cp -r src/browsers/* $DIST_DIR/src/browsers/
cp -r src/config/* $DIST_DIR/src/config/
cp -r src/core/* $DIST_DIR/src/core/
cp -r src/scrapper/*.js $DIST_DIR/src/scrapper/
cp -r src/scrapper/platforms/* $DIST_DIR/src/scrapper/platforms/
cp -r src/types/* $DIST_DIR/src/types/
cp -r src/utils/* $DIST_DIR/src/utils/
cp -r src/env $DIST_DIR/src/
cp -r src/aws $DIST_DIR/src/
cp -r src/notification $DIST_DIR/src/

# ZIP 파일 생성 (node_modules 제외)
echo "Lambda 배포 패키지 생성 중..."
zip -r $LAMBDA_ZIP $DIST_DIR/*

lambdaSize=$(du -h $LAMBDA_ZIP | cut -f1)
echo "Lambda 함수 배포 패키지 생성 완료: $LAMBDA_ZIP"
echo "패키지 크기: $lambdaSize"
echo "참고: 의존성은 Lambda Layer를 통해 제공되어야 합니다."

echo ""
echo "=== 빌드 완료 ==="
echo "빌드 결과 위치: $BUILD_DIR"
echo "Lambda 함수: $LAMBDA_ZIP"
echo "Layer 생성: npm run build:layer:unix" 