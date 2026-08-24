const pool = require('../db/pool');
const ApiError = require('../utils/ApiError');
const aiService = require('./ai.service');
const appointmentService = require('./appointment.service');

async function getOrCreateSession(userId, sessionId) {
  if (sessionId) {
    const result = await pool.query(
      'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Chat session not found');
    }
    return result.rows[0];
  }

  const created = await pool.query(
    'INSERT INTO chat_sessions (user_id, messages) VALUES ($1, $2) RETURNING *',
    [userId, JSON.stringify([])]
  );
  return created.rows[0];
}

async function appendMessages(sessionId, newMessages) {
  const result = await pool.query(
    `UPDATE chat_sessions
     SET messages = messages || $2::jsonb
     WHERE id = $1
     RETURNING *`,
    [sessionId, JSON.stringify(newMessages)]
  );
  return result.rows[0];
}

async function listMessages(userId, sessionId) {
  const session = await getOrCreateSession(userId, sessionId);
  return session.messages;
}

/**
 * Core orchestration for one turn of the conversation.
 * @returns {Promise<{ sessionId, reply, needsForm, extractedData, appointment }>}
 */
async function handleMessage({ userId, sessionId, text }) {
  const session = await getOrCreateSession(userId, sessionId);

  const userMessage = { role: 'user', text, createdAt: new Date().toISOString() };
  await appendMessages(session.id, [userMessage]);

  // Rebuild conversation history (including the message just added) for AI context.
  const conversationHistory = [...session.messages, userMessage];

  const { reply, extractedData, isComplete, aiFailed } =
    await aiService.extractBookingInfo(conversationHistory);

  // Requirement: log AI interactions for debugging/analytics.
  console.log('[AI Interaction]', {
    sessionId: session.id,
    userId,
    input: text,
    extractedData,
    isComplete,
    aiFailed,
  });

  let appointment = null;
  if (isComplete && !aiFailed) {
    appointment = await appointmentService.createAppointment({
      userId,
      chatSessionId: session.id,
      serviceName: extractedData.serviceName,
      appointmentDate: extractedData.appointmentDate,
      appointmentTime: extractedData.appointmentTime,
    });
  }

  const botMessage = {
    role: 'bot',
    text: appointment
      ? `${reply} Your appointment is booked for ${appointment.appointment_date} at ${appointment.appointment_time}.`
      : reply,
    extractedData,
    createdAt: new Date().toISOString(),
  };
  await appendMessages(session.id, [botMessage]);

  // Fallback to structured form when AI is down OR extraction is incomplete after this turn.
  const needsForm = aiFailed || !isComplete;

  return {
    sessionId: session.id,
    reply: botMessage.text,
    needsForm,
    extractedData,
    appointment,
  };
}

module.exports = { getOrCreateSession, listMessages, handleMessage };
