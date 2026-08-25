import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(form);
    if (ok) navigate('/chat');
  };

  const inputClass = 'px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition';
  const labelClass = 'flex flex-col gap-1.5 text-sm font-medium text-gray-500';

  return (
    <div className="flex justify-center px-5 py-20 bg-gray-50/50 min-h-[calc(100vh-60px)]">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-sm bg-white border border-gray-100 rounded-2xl shadow-sm p-8"
      >
        <div className="mb-1">
          <h1 className="text-xl font-bold text-gray-900 m-0">Welcome back</h1>
          <p className="text-sm text-gray-400 mt-1">Log in to manage your appointments</p>
        </div>
        <label className={labelClass}>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange} required className={inputClass} />
        </label>
        <label className={labelClass}>
          Password
          <input type="password" name="password" value={form.password} onChange={handleChange} required className={inputClass} />
        </label>
        {error && <p className="text-red-600 text-sm m-0">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover transition disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-sm text-gray-400 text-center m-0">
          No account? <Link to="/signup" className="text-primary font-medium">Sign up</Link>
        </p>
      </form>
    </div>
  );
}