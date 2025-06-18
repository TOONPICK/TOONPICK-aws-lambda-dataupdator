#!/bin/bash

# Lambda Layer 생성을 위한 스크립트

# 빌드 환경 설정
BUILD_DIR="build"
DIST_DIR="$BUILD_DIR/dist"
LAYER_DIR="$BUILD_DIR/layer"
LAMBDA_ZIP="$BUILD_DIR/lambda.zip"
LAYER_ZIP="$BUILD_DIR/layer.zip"

# 이전 빌드 정리
rm -rf $LAYER_DIR
rm -f $LAYER_ZIP

# build 디렉토리 생성 (없는 경우)
mkdir -p $BUILD_DIR

# Layer 디렉토리 생성
mkdir -p $LAYER_DIR/nodejs

echo "=== Lambda Layer 생성 ==="

# Layer용 package.json 생성
cat > $LAYER_DIR/nodejs/package.json << 'EOF'
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
EOF

# 의존성 설치
echo "Lambda Layer 의존성 설치 중..."
current_dir=$(pwd)
cd $LAYER_DIR/nodejs
npm install --production --no-optional
cd $current_dir

# ZIP 파일 생성
echo "Lambda Layer 패키지 생성 중..."
zip -r $LAYER_ZIP $LAYER_DIR/*

if [ -f "$LAYER_ZIP" ]; then
    layerSize=$(du -h $LAYER_ZIP | cut -f1)
    echo "Lambda Layer 생성 완료: $LAYER_ZIP"
    echo "Layer 크기: $layerSize"
else
    echo "Layer 생성 실패!"
    exit 1
fi

echo ""
echo "다음 명령으로 Layer를 AWS에 업로드하세요:"
echo "aws lambda publish-layer-version --layer-name webtoon-crawler-deps --description 'Dependencies for Webtoon Crawler' --zip-file fileb://$LAYER_ZIP --compatible-runtimes nodejs18.x --region ap-northeast-2"

echo ""
echo "=== Layer 생성 완료 ==="
echo "Layer 위치: $LAYER_ZIP" 