class SQSMessage {
  toJson() {
    try {
      return JSON.stringify(this);
    } catch (e) {
      return "{}";
    }
  }
}

module.exports = SQSMessage; 