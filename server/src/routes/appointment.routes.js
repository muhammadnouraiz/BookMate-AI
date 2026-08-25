const { Router } = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { CITIES } = require('../utils/doctors');
const appointmentController = require('../controllers/appointment.controller');

const router = Router();

router.use(requireAuth);

const createValidators = [
  body('serviceName').trim().notEmpty().withMessage('serviceName is required'),
  body('city').trim().isIn(CITIES).withMessage(`city must be one of: ${CITIES.join(', ')}`),
  body('appointmentDate').isISO8601().withMessage('appointmentDate must be YYYY-MM-DD'),
  body('appointmentTime')
    .matches(/^\d{2}:\d{2}(:\d{2})?$/)
    .withMessage('appointmentTime must be HH:MM'),
  body('chatSessionId').optional({ nullable: true }).isUUID(),
];

const idParamValidator = [param('id').isUUID().withMessage('id must be a valid UUID')];

router.post('/', validate(createValidators), appointmentController.createAppointment);
router.get('/', appointmentController.listAppointments);
router.get('/:id', validate(idParamValidator), appointmentController.getAppointment);
router.patch('/:id/cancel', validate(idParamValidator), appointmentController.cancelAppointment);

module.exports = router;