const authService = require('../services/auth.service');

async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const { user, token } = await authService.signup({ name, email, password });
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login({ email, password });
    res.status(200).json({ user, token });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login };
