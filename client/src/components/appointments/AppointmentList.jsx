import { useState, useEffect, useCallback } from 'react';
import * as appointmentsApi from '../../api/appointments.api';
import AppointmentCard from './AppointmentCard';

function SkeletonCard() {
  return (
    <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
      <div className="skeleton h-6 w-16 rounded-full" />
    </div>
  );
}

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

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) return <p className="text-red-600 text-sm">{error}</p>;

  if (appointments.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
        <p className="text-gray-400 text-sm">No appointments yet — book one from the chat.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {appointments.map((a) => (
        <AppointmentCard key={a.id} appointment={a} onCancel={handleCancel} />
      ))}
    </div>
  );
}