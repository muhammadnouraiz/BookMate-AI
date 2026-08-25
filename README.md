# BookMate AI — AI-Assisted Appointment Booking Chatbot

A full-stack web app with a conversational chatbot that books appointments using natural language, built as a Full Stack Developer technical assessment.

**Live demo:** https://bookmate-ai-client.vercel.app
**Backend API:** https://bookmate-ai-server.vercel.app
**Repository:** https://github.com/muhammadnouraiz/BookMate-AI

---

## Overview

A user signs up, chats with an AI assistant to book an appointment (service, city, date, time), and manages their bookings from a dashboard. The AI drives the conversation naturally; a deterministic state machine handles confirmation and gracefully falls back to a structured form if the conversation stalls.

---

## Architecture

```
React (Vite + Tailwind)  --REST + JWT-->  Express (Vercel serverless)  -->  PostgreSQL (Neon)
                                                    |
                                                    +--> Mistral AI (booking extraction)
```

- **Frontend:** React (Vite), Tailwind CSS v4, React Router, Axios, Context API for auth state.
- **Backend:** Node.js + Express, layered as Routes → Controllers → Services. Deployed as Vercel serverless functions via a single entry point (`api/index.js`) wrapping the Express app.
- **Database:** PostgreSQL (Neon), raw SQL via `pg` — no ORM.
- **AI:** Mistral API, isolated entirely in `ai.service.js`.

### Backend layout

```
server/src/
├── routes/        request validation + endpoint definitions
├── controllers/    thin HTTP layer (parse request, call service, respond)
├── services/       business logic: auth, chat state machine, AI calls, bookings
├── middleware/      auth, validation, rate limiting, logging, error handling
├── db/              connection pool, schema.sql, seed.sql
└── utils/           JWT helpers, typed errors, mocked doctor directory
```

### Frontend layout

```
client/src/
├── api/             axios instance + endpoint wrappers
├── context/         AuthContext (JWT + user state)
├── hooks/           useAuth, useChatPolling (adaptive polling)
├── components/      chat/, appointments/, common/
└── pages/           Login, Signup, Chat, Dashboard
```

---

## Running locally

### Backend

```bash
cd server
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, MISTRAL_API_KEY
psql $DATABASE_URL -f src/db/schema.sql   # or paste into Neon's SQL Editor
psql $DATABASE_URL -f src/db/seed.sql     # optional sample data
npm run dev             # http://localhost:5000
```

### Frontend

```bash
cd client
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:5000/api
npm run dev              # http://localhost:5173
```

---

## The booking flow

```
[User signs up / logs in] -> JWT issued -> chat unlocked

"Hi, I need to book an appointment"
  -> AI: "What specific service?"
"Consultation"
  -> AI: "What date, time, and city?"
"Lahore, next Tuesday afternoon"
  -> AI extracts: service=Consultation, city=Lahore, date=resolved, time=ambiguous
  -> AI: "Please specify the exact time"
"Just whenever"
  -> still ambiguous -> fallback form appears, pre-filled with what's already known
  -> user fills in the missing exact time, submits
  -> OR, if all 4 fields were clear from chat: AI asks "Shall I confirm? (yes/no)"
"yes"
  -> appointment saved to PostgreSQL, confirmation (with doctor, clinic, contact) appended to chat history
```

This is implemented as a small state machine (`collecting -> awaiting_confirmation -> awaiting_form -> booked`) layered on top of the AI — only the `collecting` stage calls Mistral; confirmation and the form are deterministic logic, so they're fast and can never be talked off-course by the LLM.

---

## Key design decisions & tradeoffs

**Polling over WebSockets.** The brief allows "real-time or near-real-time." Chat updates poll every 3 seconds, back off to 15 seconds once the conversation has been idle for a while, and pause entirely when the browser tab isn't visible — near-real-time UX without WebSocket connection management overhead. Would move to WebSockets/SSE for a production system with many concurrent users.

**Chat state as JSONB, not a normalized `messages` table.** Each `chat_sessions` row stores messages as a JSONB array, including hidden `stage`/`bookingData` metadata on bot messages that drives the frontend's UI (form vs. confirmation buttons vs. plain chat) without a separate state table. Keeps the booking flow's state colocated with the conversation for a low-volume, per-session read pattern. Would normalize into a `messages` table if message-level querying/analytics were needed at scale.

**Deterministic state machine over freeform multi-turn AI.** Only the extraction step is AI-driven; confirmation, the fallback form, and the "stuck" detection (same information given twice with no progress) are plain logic. This keeps the AI's job narrow and reliable — directly serving the brief's note that this should be "practical AI integration, not experimentation."

**Isolated AI service with a hard fallback.** `ai.service.js` is the only file that calls Mistral, wrapped with a 15-second timeout via `AbortController`. If the API times out, errors, or returns malformed JSON, the flow falls back to the structured form rather than hanging — satisfying "fallback to structured forms if input is incomplete or ambiguous" for both ambiguous *and* failed AI cases.

**Mocked doctor directory.** No real staff/business data exists for this assessment. Each of the four supported cities (Lahore, Islamabad, Rawalpindi, Faisalabad) maps to one fixed doctor with a name, clinic, and contact number in `utils/doctors.js`. A production version would replace this with a real `staff` table (`id, name, specialty, city_id, business_id`) joined against a `businesses`/`clinics` table, queried by service + city instead of hardcoded.

**JWT over sessions.** Stateless auth pairs naturally with a decoupled React SPA + serverless API — no server-side session store needed.

**Deployed on Vercel (serverless) for both frontend and backend.** Single-platform deployment for simplicity. The backend runs as serverless functions rather than a long-lived Node process, which has two concrete implications: (1) `express-rate-limit`'s in-memory counters reset on cold starts, so rate limiting is less consistent than on a persistent server; (2) the `pg` pool is recreated more often than in a traditional deployment. Neither affects correctness at this scale, but production traffic would call for a persistent host (e.g. Render) or a serverless-aware connection pooler (e.g. Neon's pooled connection string / PgBouncer).

**No ORM.** Raw SQL via `pg` for transparency — every query is explicit and easy to audit, at the cost of some boilerplate versus a query builder.

---

## Assumptions & known limitations

- **Multi-tenancy (`business_id`) was skipped** — explicitly optional in the brief. Adding it later means adding `business_id` to `users`/`appointments` and scoping every query by it.
- **Doctor/clinic data is mocked** (see above) — not sourced from a real directory.
- **No email/SMS notifications** on booking — out of scope for the brief's core deliverables.
- **AI extraction depends on Mistral's free-tier model** — occasional slower responses (3–5s) are expected and handled via the timeout/fallback described above, not a bug.
- **Rate limiting is best-effort under serverless deployment**, as noted above.
- **No appointment editing** — only cancel is supported, matching the brief's "creation and retrieval" requirement; editing would be a natural next feature.
- **No automated test suite** — given the assessment's time constraints, testing effort went into manual end-to-end verification of every flow (auth, chat state transitions, form fallback, confirmation, cancellation) instead. Unit tests for the state machine helpers (`isBookingComplete`, `fieldsEqual`) and the AI service's parsing/fallback logic would be the first additions in a follow-up pass.

---

## Tech stack summary

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS v4, React Router, Axios |
| Backend | Node.js, Express, express-validator, express-rate-limit, morgan |
| Database | PostgreSQL (Neon), raw SQL via `pg` |
| Auth | JWT (jsonwebtoken, bcryptjs) |
| AI | Mistral API |
| Deployment | Vercel (frontend + backend, serverless) |
