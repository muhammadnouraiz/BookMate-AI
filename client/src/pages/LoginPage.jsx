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

  const inputClass = 'px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary';
  const labelClass = 'flex flex-col gap-1.5 text-sm text-gray-500';

  return (
    <div className="flex justify-center px-5 py-16">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3.5 w-full max-w-sm bg-white border border-gray-200 rounded-xl p-8"
      >
        <h1 className="text-xl font-bold m-0 mb-2">Log in</h1>
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
          className="px-4 py-2.5 font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-sm text-gray-500 text-center m-0">
          No account? <Link to="/signup" className="text-primary">Sign up</Link>
        </p>
      </form>
    </div>
  );
}