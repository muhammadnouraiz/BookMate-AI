const { env } = require('../config/env');
const { CITIES } = require('../utils/doctors');

const REQUEST_TIMEOUT_MS = 15000;

function buildSystemPrompt(knownData) {
  const today = new Date().toISOString().slice(0, 10);
  return `You are a booking assistant for a service business (e.g. clinic, salon, consultancy).
Today's date is ${today}.
We only operate in these four cities: ${CITIES.join(', ')}.

Known so far (do not ask about these again unless the user changes them):
- Service: ${knownData.serviceName || 'not yet known'}
- City: ${knownData.city || 'not yet known'}
- Date: ${knownData.appointmentDate || 'not yet known'}
- Time: ${knownData.appointmentTime || 'not yet known'}

Read the conversation and respond with ONLY valid JSON, no markdown, no commentary, matching this exact shape:
{
  "reply": "<short natural-language message to show the user, under 2 sentences>",
  "intent": "booking" | "other",
  "serviceName": "<string or null>",
  "city": "<one of ${CITIES.join(', ')}, or null>",
  "appointmentDate": "<YYYY-MM-DD or null>",
  "appointmentTime": "<HH:MM 24-hour exact time, or null>"
}

Rules:
- Set "intent" to "booking" if the user wants to schedule an appointment or is describing a need a service could address. Otherwise "other".
- If "other": briefly explain you can only help with booking an appointment, in "reply", and leave all four fields null.
- Only set a field if the user's LATEST message clearly states it — leave it null otherwise. Do not repeat previously known values.
- Resolve relative dates (e.g. "next Tuesday") into an exact YYYY-MM-DD using today's date above.
- appointmentTime must be one exact time. If the user gives a vague time ("afternoon", "whenever", a range like "1pm-4pm"), leave appointmentTime null.
- city must exactly match one of the four supported cities. If the user names a different city, leave city null and ask them to pick one of the four in "reply".
- In "reply", ask specifically for the next missing piece of information, in this priority order: service, then city, then date, then time. Ask for only ONE at a time.`;
}

async function callMistral(conversationHistory, knownData) {
  const messages = [
    { role: 'system', content: buildSystemPrompt(knownData) },
    ...conversationHistory.map((m) => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.text,
    })),
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
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
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Mistral API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error('Mistral API returned no content');
    return JSON.parse(rawContent);
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeCity(city) {
  if (!city) return null;
  const match = CITIES.find((c) => c.toLowerCase() === String(city).toLowerCase());
  return match || null;
}

/**
 * @param {Array<{role:'user'|'bot', text:string}>} conversationHistory
 * @param {{serviceName, city, appointmentDate, appointmentTime}} knownData
 * @returns {Promise<{reply, intent:'booking'|'other', serviceName, city, appointmentDate, appointmentTime, aiFailed}>}
 */
async function extractBookingDetails(conversationHistory, knownData = {}) {
  try {
    const parsed = await callMistral(conversationHistory, knownData);
    return {
      reply: parsed.reply || 'Could you tell me a bit more?',
      intent: parsed.intent === 'booking' ? 'booking' : 'other',
      serviceName: parsed.serviceName || null,
      city: normalizeCity(parsed.city),
      appointmentDate: parsed.appointmentDate || null,
      appointmentTime: parsed.appointmentTime || null,
      aiFailed: false,
    };
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'timed out' : err.message;
    console.error('[AI Service] Mistral call failed:', reason);
    return {
      reply: "I'm having trouble understanding right now.",
      intent: 'booking',
      serviceName: null,
      city: null,
      appointmentDate: null,
      appointmentTime: null,
      aiFailed: true,
    };
  }
}

module.exports = { extractBookingDetails };