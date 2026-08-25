import { useState, useEffect, useCallback } from 'react';
import * as appointmentsApi from '../../api/appointments.api';
import AppointmentCard from './AppointmentCard';
import Loader from '../common/Loader';

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { appointments } = await appointmentsApi.listAppointments();
      setAppointments(appointments);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (id) => {
    try {
      await appointmentsApi.cancelAppointment(id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a))
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel appointment');
    }
  };

  if (loading) return <Loader label="Loading your appointments…" />;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (appointments.length === 0)
    return <p className="text-gray-500">No appointments yet — book one from the chat.</p>;

  return (
    <div className="flex flex-col gap-3">
      {appointments.map((a) => (
        <AppointmentCard key={a.id} appointment={a} onCancel={handleCancel} />
      ))}
    </div>
  );
}