const { env, assertRequiredEnv } = require('./config/env');

assertRequiredEnv(); // fail fast if .env is misconfigured

const app = require('./app');

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port} [${env.nodeEnv}]`);
});
