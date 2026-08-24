const pool = require('../db/pool');
const ApiError = require('../utils/ApiError');

async function createAppointment({ userId, chatSessionId = null, serviceName, appointmentDate, appointmentTime, notes = null }) {
  const result = await pool.query(
    `INSERT INTO appointments (user_id, chat_session_id, service_name, appointment_date, appointment_time, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, chatSessionId, serviceName, appointmentDate, appointmentTime, notes]
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

module.exports = {
  createAppointment,
  listAppointmentsByUser,
  getAppointmentById,
  updateAppointmentStatus,
};
