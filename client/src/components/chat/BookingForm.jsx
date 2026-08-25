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

  const inputClass = 'px-3 py-2 border border-gray-200 rounded-md text-sm bg-white';
  const labelClass = 'flex flex-col gap-1 text-xs text-gray-500';

  return (
    <form className="flex flex-col gap-3 max-w-[90%] bg-gray-50 border border-gray-200 rounded-xl p-4" onSubmit={handleSubmit}>
      <p className="font-semibold text-sm m-0">Let's finish booking your appointment</p>

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

      <label className={labelClass}>
        Date
        <input type="date" name="appointmentDate" value={form.appointmentDate} onChange={handleChange} required className={inputClass} />
      </label>

      <label className={labelClass}>
        Time
        <input type="time" name="appointmentTime" value={form.appointmentTime} onChange={handleChange} required className={inputClass} />
      </label>

      <div className="flex justify-end gap-2 mt-1">
        <button type="button" onClick={onCancel} disabled={submitting} className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-60">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-60">
          {submitting ? 'Booking…' : 'Confirm booking'}
        </button>
      </div>
    </form>
  );
}