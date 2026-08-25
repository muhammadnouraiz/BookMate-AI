import { useState } from 'react';

const CITIES = ['Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad'];

export default function BookingForm({ bookingData = {}, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    serviceName: bookingData.serviceName || '',
    city: bookingData.city || '',
    appointmentDate: bookingData.appointmentDate || '',
    appointmentTime: bookingData.appointmentTime || '',
  });

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputClass =
    'px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition';
  const labelClass = 'flex flex-col gap-1.5 text-xs font-medium text-gray-500';

  return (
    <form
      className="msg-enter flex flex-col gap-3.5 max-w-[92%] bg-primary-light/40 border border-primary/15 rounded-2xl p-5"
      onSubmit={handleSubmit}
    >
      <p className="font-semibold text-sm text-gray-800 m-0 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
        Let's finish booking your appointment
      </p>

      <label className={labelClass}>
        Service
        <input name="serviceName" value={form.serviceName} onChange={handleChange} required className={inputClass} />
      </label>

      <label className={labelClass}>
        City
        <select name="city" value={form.city} onChange={handleChange} required className={inputClass}>
          <option value="" disabled>Select a city</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Date
          <input type="date" name="appointmentDate" value={form.appointmentDate} onChange={handleChange} required className={inputClass} />
        </label>
        <label className={labelClass}>
          Time
          <input type="time" name="appointmentTime" value={form.appointmentTime} onChange={handleChange} required className={inputClass} />
        </label>
      </div>

      <div className="flex justify-end gap-2 mt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-500 hover:bg-white transition disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover transition disabled:opacity-60"
        >
          {submitting ? 'Booking…' : 'Confirm booking'}
        </button>
      </div>
    </form>
  );
}