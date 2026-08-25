// Vercel serverless entry point — exports the Express app directly instead
// of calling app.listen(), since Vercel manages the HTTP server itself.
// Local dev still uses src/server.js (npm run dev) unchanged.
const app = require('../src/app');

module.exports = app;