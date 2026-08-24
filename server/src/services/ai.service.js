const { env } = require('../config/env');

// This is the ONLY file in the codebase that talks to the AI provider.
// chatService calls this and only ever sees { reply, extractedData, isComplete }.
// If Mistral is down or errors, callers get a graceful fallback signal, never a thrown 500.

const REQUIRED_FIELDS = ['serviceName', 'appointmentDate', 'appointmentTime'];

const SYSTEM_PROMPT = `You are a booking assistant for a service business (e.g. salon, clinic, consultancy).
Your job: read the conversation and reply naturally AND extract booking details.

Respond with ONLY valid JSON, no markdown, no commentary, matching this exact shape:
{
  "reply": "<short natural-language message to show the user>",
  "extractedData": {
    "serviceName": "<string or null>",
    "appointmentDate": "<YYYY-MM-DD or null>",
    "appointmentTime": "<HH:MM 24h or null>",
    "customerName": "<string or null>"
  }
}

Rules:
- If the user hasn't given enough info yet, ask a clarifying question in "reply" and leave the missing fields null.
- Never invent a date/time/service the user didn't state or clearly imply.
- Assume the current year is 2026 if the user gives a partial date.
- Keep "reply" conversational and under 2 sentences.`;

async function callMistral(conversationHistory) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.map((m) => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.text,
    })),
  ];

  const response = await fetch(env.mistralApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.mistralApiKey}`,
    },
    body: JSON.stringify({
      model: env.mistralModel,
      messages,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Mistral API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('Mistral API returned no content');
  }

  return JSON.parse(rawContent); // may throw if model didn't return valid JSON
}

function isExtractionComplete(extractedData) {
  if (!extractedData) return false;
  return REQUIRED_FIELDS.every((field) => Boolean(extractedData[field]));
}

/**
 * @param {Array<{role: 'user'|'bot', text: string}>} conversationHistory
 * @returns {Promise<{ reply: string, extractedData: object, isComplete: boolean, aiFailed: boolean }>}
 */
async function extractBookingInfo(conversationHistory) {
  try {
    const parsed = await callMistral(conversationHistory);
    const extractedData = parsed.extractedData || {};
    return {
      reply: parsed.reply || "Let's get your appointment booked — could you share a few more details?",
      extractedData,
      isComplete: isExtractionComplete(extractedData),
      aiFailed: false,
    };
  } catch (err) {
    // Log for debugging/analytics per the assignment requirement, then degrade gracefully.
    console.error('[AI Service] Mistral call failed:', err.message);
    return {
      reply: "I'm having trouble understanding right now — let's use the quick form instead.",
      extractedData: {},
      isComplete: false,
      aiFailed: true,
    };
  }
}

module.exports = { extractBookingInfo, REQUIRED_FIELDS };
