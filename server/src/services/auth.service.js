const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

async function signup({ name, email, password }) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, passwordHash]
  );

  const user = result.rows[0];
  const token = signToken({ id: user.id, email: user.email });
  return { user, token };
}

async function login({ email, password }) {
  const result = await pool.query(
    'SELECT id, name, email, password_hash FROM users WHERE email = $1',
    [email]
  );
  const userRow = result.rows[0];

  // Same error message for "no user" and "wrong password" — avoid leaking which one failed.
  if (!userRow) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, userRow.password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const user = { id: userRow.id, name: userRow.name, email: userRow.email };
  const token = signToken({ id: user.id, email: user.email });
  return { user, token };
}

module.exports = { signup, login };
