const pool = require('../db/pool');
const ApiError = require('../utils/ApiError');
const { getDoctorForCity } = require('../utils/doctors');

async function createAppointment({ userId, chatSessionId = null, serviceName, city, doctorName, appointmentDate, appointmentTime, notes = null }) {
  const result = await pool.query(
    `INSERT INTO appointments (user_id, chat_session_id, service_name, city, doctor_name, appointment_date, appointment_time, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, chatSessionId, serviceName, city, doctorName, appointmentDate, appointmentTime, notes]
  );
  return result.rows[0];
}

async function listAppointmentsByUser(userId) {
  const result = await pool.query(
    `SELECT * FROM appointments WHERE user_id = $1 ORDER BY appointment_date DESC, appointment_time DESC`,
    [userId]
  );
  return result.rows;
}

async function getAppointmentById(id, userId) {
  const result = await pool.query(
    `SELECT * FROM appointments WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  if (result.rows.length === 0) {
    throw new ApiError(404, 'Appointment not found');
  }
  return result.rows[0];
}

async function updateAppointmentStatus(id, userId, status) {
  const result = await pool.query(
    `UPDATE appointments SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
    [status, id, userId]
  );
  if (result.rows.length === 0) {
    throw new ApiError(404, 'Appointment not found');
  }
  return result.rows[0];
}

async function getUserName(userId) {
  const result = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.name || 'Guest';
}

/**
 * Single source of truth for turning known booking fields into a real
 * appointment + confirmation message. Used by both the chat "yes" flow
 * and the fallback form submission, so the two paths can never drift apart.
 */
async function bookAppointment({ userId, chatSessionId, serviceName, city, appointmentDate, appointmentTime }) {
  const doctor = getDoctorForCity(city);
  const customerName = await getUserName(userId);

  const appointment = await createAppointment({
    userId,
    chatSessionId: chatSessionId || null,
    serviceName,
    city,
    doctorName: doctor.name,
    appointmentDate,
    appointmentTime,
  });

  const confirmationText =
    `Your appointment is confirmed, ${customerName}! ${serviceName} on ${appointment.appointment_date} ` +
    `at ${appointment.appointment_time.slice(0, 5)} in ${city}, with ${doctor.name} at ${doctor.clinicName}. ` +
    `Contact: ${doctor.contact}. Thank you!`;

  return { appointment, doctor, confirmationText };
}

module.exports = {
  createAppointment,
  listAppointmentsByUser,
  getAppointmentById,
  updateAppointmentStatus,
  getUserName,
  bookAppointment,
};