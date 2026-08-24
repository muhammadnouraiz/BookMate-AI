const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');

const { requestLogger } = require('./middleware/logger.middleware');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const { errorHandler, notFound } = require('./middleware/errorHandler.middleware');

const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const appointmentRoutes = require('./routes/appointment.routes');

const app = express();

// --- Global middleware ---
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(requestLogger);
app.use(apiLimiter);

// --- Health check (useful for deployment platforms) ---
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/appointments', appointmentRoutes);

// --- 404 + error handler (must be registered last, in this order) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
