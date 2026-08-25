const appointmentService = require('../services/appointment.service');
const chatService = require('../services/chat.service');

// Fallback-form submission path — mirrors the chat "yes" flow via the same
// appointmentService.bookAppointment, so both paths stay in sync.
async function createAppointment(req, res, next) {
  try {
    const { serviceName, city, appointmentDate, appointmentTime, chatSessionId } = req.body;

    const { appointment, doctor, confirmationText } = await appointmentService.bookAppointment({
      userId: req.user.id,
      chatSessionId: chatSessionId || null,
      serviceName,
      city,
      appointmentDate,
      appointmentTime,
    });

    await chatService.appendBookingConfirmationMessage(chatSessionId, confirmationText);

    res.status(201).json({ appointment, doctor });
  } catch (err) {
    next(err);
  }
}

async function listAppointments(req, res, next) {
  try {
    const appointments = await appointmentService.listAppointmentsByUser(req.user.id);
    res.status(200).json({ appointments });
  } catch (err) {
    next(err);
  }
}

async function getAppointment(req, res, next) {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id, req.user.id);
    res.status(200).json({ appointment });
  } catch (err) {
    next(err);
  }
}

async function cancelAppointment(req, res, next) {
  try {
    const appointment = await appointmentService.updateAppointmentStatus(
      req.params.id,
      req.user.id,
      'cancelled'
    );
    res.status(200).json({ appointment });
  } catch (err) {
    next(err);
  }
}

module.exports = { createAppointment, listAppointments, getAppointment, cancelAppointment };