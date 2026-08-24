const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Wrap an array of express-validator checks: [check('email').isEmail(), ...]
// Usage in routes: router.post('/signup', validate(signupValidators), controller)
function validate(validators) {
  return async (req, res, next) => {
    await Promise.all(validators.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError(400, 'Validation failed', errors.array()));
    }
    next();
  };
}

module.exports = { validate };
