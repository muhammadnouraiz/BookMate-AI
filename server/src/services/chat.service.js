const pool = require('../db/pool');
const ApiError = require('../utils/ApiError');
const aiService = require('./ai.service');
const appointmentService = require('./appointment.service');

// One "stuck" turn (no new info while still incomplete) triggers the form —
// matches "ambiguous input triggers fallback" from the intended flow.
const MAX_STUCK_ATTEMPTS = 1;

// Named intent patterns — pulled out of the flow logic below so the state
// machine reads clearly and these can be tuned in one place.
const RESTART_PATTERN = /^\s*(start over|restart)\b/i;
const CONFIRM_YES_PATTERN = /^\s*(yes|yeah|yep|confirm|sure|ok(ay)?)\b/i;
const CONFIRM_NO_PATTERN = /^\s*(no|nope|cancel)\b/i;

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

function getLastBotState(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === 'bot' && m.stage) {
      return { stage: m.stage, bookingData: m.bookingData || {} };
    }
  }
  return { stage: 'collecting', bookingData: {} };
}

function buildBotMessage(text, stage, bookingData) {
  return { role: 'bot', text, stage, bookingData, createdAt: new Date().toISOString() };
}

function fieldsEqual(a, b) {
  return ['serviceName', 'city', 'appointmentDate', 'appointmentTime'].every(
    (f) => (a[f] || null) === (b[f] || null)
  );
}

function isBookingComplete(data) {
  return Boolean(data.serviceName && data.city && data.appointmentDate && data.appointmentTime);
}

function formatConfirmationPrompt(data) {
  return `To confirm: book a ${data.serviceName} appointment in ${data.city} on ${data.appointmentDate} at ${data.appointmentTime}. Shall I confirm this booking? (yes/no)`;
}

/**
 * One turn of the booking conversation. State machine with three stages:
 *   collecting -> (all fields known) -> awaiting_confirmation -> (yes) -> booked, resets to collecting
 *   collecting -> (stuck once) -> awaiting_form -> (form submitted elsewhere) -> confirmation appended, resets to collecting
 */
async function handleMessage({ userId, sessionId, text }) {
  const session = await getOrCreateSession(userId, sessionId);

  const userMessage = { role: 'user', text, createdAt: new Date().toISOString() };
  await appendMessages(session.id, [userMessage]);

  const { stage, bookingData } = getLastBotState(session.messages);

  if (RESTART_PATTERN.test(text)) {
    const botMessage = buildBotMessage(
      "No problem — let's start fresh. What service would you like to book?",
      'collecting',
      {}
    );
    await appendMessages(session.id, [botMessage]);
    return { sessionId: session.id, reply: botMessage.text };
  }

  let botMessage;

  if (stage === 'awaiting_form') {
    botMessage = buildBotMessage(
      'Please complete the form above to continue, or type "start over" to restart.',
      'awaiting_form',
      bookingData
    );
  } else if (stage === 'awaiting_confirmation') {
    if (CONFIRM_YES_PATTERN.test(text)) {
      const { confirmationText } = await appointmentService.bookAppointment({
        userId,
        chatSessionId: session.id,
        serviceName: bookingData.serviceName,
        city: bookingData.city,
        appointmentDate: bookingData.appointmentDate,
        appointmentTime: bookingData.appointmentTime,
      });
      botMessage = buildBotMessage(confirmationText, 'collecting', {});
    } else if (CONFIRM_NO_PATTERN.test(text)) {
      botMessage = buildBotMessage(
        "Okay, let's adjust. What would you like to change?",
        'collecting',
        bookingData
      );
    } else {
      botMessage = buildBotMessage(
        `Please reply "yes" to confirm or "no" to make changes. ${formatConfirmationPrompt(bookingData)}`,
        'awaiting_confirmation',
        bookingData
      );
    }
  } else {
    // stage === 'collecting'
    const conversationHistory = [...session.messages, userMessage];
    const { reply, intent, serviceName, city, appointmentDate, appointmentTime, aiFailed } =
      await aiService.extractBookingDetails(conversationHistory, bookingData);

    console.log('[AI Interaction]', {
      sessionId: session.id, userId, input: text, intent, serviceName, city, appointmentDate, appointmentTime, aiFailed,
    });

    if (intent !== 'booking' && !aiFailed) {
      botMessage = buildBotMessage(reply, 'collecting', bookingData);
    } else {
      const merged = {
        serviceName: serviceName || bookingData.serviceName || null,
        city: city || bookingData.city || null,
        appointmentDate: appointmentDate || bookingData.appointmentDate || null,
        appointmentTime: appointmentTime || bookingData.appointmentTime || null,
      };

      if (isBookingComplete(merged)) {
        botMessage = buildBotMessage(formatConfirmationPrompt(merged), 'awaiting_confirmation', merged);
      } else {
        const madeProgress = !fieldsEqual(merged, bookingData);
        const stuckAttempts = madeProgress ? 0 : (bookingData._stuckAttempts || 0) + 1;

        if (aiFailed || stuckAttempts >= MAX_STUCK_ATTEMPTS) {
          botMessage = buildBotMessage(
            aiFailed
              ? "I'm having a bit of trouble understanding — let's use the quick form to finish up."
              : "Let's use the quick form to pin down the last details.",
            'awaiting_form',
            merged
          );
        } else {
          botMessage = buildBotMessage(reply, 'collecting', { ...merged, _stuckAttempts: stuckAttempts });
        }
      }
    }
  }

  await appendMessages(session.id, [botMessage]);
  return { sessionId: session.id, reply: botMessage.text };
}

/**
 * Appends a booking confirmation into the chat session's DB record and
 * resets the flow to 'collecting' — used after the fallback form is submitted.
 */
async function appendBookingConfirmationMessage(sessionId, text) {
  if (!sessionId) return;
  await appendMessages(sessionId, [
    { role: 'bot', text, stage: 'collecting', bookingData: {}, createdAt: new Date().toISOString() },
  ]);
}

module.exports = { getOrCreateSession, listMessages, handleMessage, appendBookingConfirmationMessage };