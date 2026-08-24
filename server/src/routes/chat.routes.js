const { Router } = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const chatController = require('../controllers/chat.controller');

const router = Router();

router.use(requireAuth); // every chat route requires a logged-in user

const sendMessageValidators = [
  body('text').trim().notEmpty().withMessage('Message text is required'),
  body('sessionId').optional().isUUID().withMessage('sessionId must be a valid UUID'),
];

const getMessagesValidators = [
  param('sessionId').isUUID().withMessage('sessionId must be a valid UUID'),
];

router.post('/message', validate(sendMessageValidators), chatController.sendMessage);
router.get('/:sessionId/messages', validate(getMessagesValidators), chatController.getMessages);

module.exports = router;
