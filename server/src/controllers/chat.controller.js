const chatService = require('../services/chat.service');

async function sendMessage(req, res, next) {
  try {
    const { sessionId, text } = req.body;
    const result = await chatService.handleMessage({
      userId: req.user.id,
      sessionId: sessionId || null,
      text,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// Polling endpoint - React calls this every few seconds to simulate real-time chat.
async function getMessages(req, res, next) {
  try {
    const { sessionId } = req.params;
    const messages = await chatService.listMessages(req.user.id, sessionId);
    res.status(200).json({ sessionId, messages });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendMessage, getMessages };
