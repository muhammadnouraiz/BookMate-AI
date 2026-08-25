const STATUS_STYLES = {
  confirmed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function AppointmentCard({ appointment, onCancel }) {
  const { service_name, city, doctor_name, appointment_date, appointment_time, status } = appointment;

  return (
    <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div>
        <p className="font-semibold text-gray-800 m-0 mb-1">{service_name}</p>
        <p className="text-gray-400 text-sm m-0">
          {appointment_date} · {appointment_time?.slice(0, 5)}
        </p>
        {(city || doctor_name) && (
          <p className="text-gray-400 text-xs m-0 mt-1.5">
            {[doctor_name, city].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[status] || ''}`}>
          {status}
        </span>
        {status !== 'cancelled' && (
          <button
            onClick={() => onCancel(appointment.id)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}