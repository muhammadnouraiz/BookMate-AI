const appointmentService = require('../services/appointment.service');

// Direct creation path for the fallback structured form (bypasses AI entirely).
async function createAppointment(req, res, next) {
  try {
    const { serviceName, appointmentDate, appointmentTime, notes, chatSessionId } = req.body;
    const appointment = await appointmentService.createAppointment({
      userId: req.user.id,
      chatSessionId: chatSessionId || null,
      serviceName,
      appointmentDate,
      appointmentTime,
      notes,
    });
    res.status(201).json({ appointment });
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
