const { v4: uuidv4 } = require('uuid');
const { handler } = require('./src/handler');
const EventTypes = require('./src/constants/EventTypes');

async function test() {
  try {
    // SQS 메시지 페이로드 생성
    const messageBody = {
      requestId: uuidv4(),
      eventType: EventTypes.WEBTOON_TITLE,
      data: {
        url: 'https://comic.naver.com/webtoon/list?titleId=747271'
      },
      message: null,
      requestTime: Date.now()
    };

    // AWS SQS 이벤트 형식으로 변환
    const event = {
      Records: [
        {
          messageId: uuidv4(),
          receiptHandle: "MessageReceiptHandle",
          body: JSON.stringify(messageBody),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: Date.now().toString(),
            SenderId: "AROAXXXXXXXXXXXXXXXXX:sender-name",
            ApproximateFirstReceiveTimestamp: Date.now().toString()
          },
          messageAttributes: {},
          md5OfBody: "e4e68fb7bd0e697a0ae8f1bb342846b3",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:region:123456789012:MyQueue",
          awsRegion: "ap-northeast-2"
        }
      ]
    };

    const result = await handler(event);
    
    // 결과 검증
    if (result.statusCode === 200) {
      console.log('테스트 성공');
    } else {
      console.log('테스트 실패');
    }
  } catch (error) {
    console.log('테스트 실패');
  }
}

// 테스트 실행
test(); 