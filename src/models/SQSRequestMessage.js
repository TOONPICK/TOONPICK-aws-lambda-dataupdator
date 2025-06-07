const { v4: uuidv4 } = require('uuid');
const SQSMessage = require('./SQSMessage');

class SQSRequestMessage extends SQSMessage {
  constructor({ requestId = uuidv4(), eventType, data, message = null } = {}) {
    super();
    this.requestId = requestId;
    this.eventType = eventType;
    this.data = data;
    this.message = message;
    this.requestTime = Date.now();
  }

  static fromJson(json) {
    try {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      return new SQSRequestMessage(parsed);
    } catch (e) {
      throw new Error(`Failed to parse SQS message: ${e.message}`);
    }
  }
}

module.exports = SQSRequestMessage; 