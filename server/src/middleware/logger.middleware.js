const morgan = require('morgan');
const { env } = require('../config/env');

// 'dev' format is concise and readable in terminal during local development/demo.
const requestLogger = morgan(env.nodeEnv === 'production' ? 'combined' : 'dev');

module.exports = { requestLogger };
