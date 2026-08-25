import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navLinkClass = ({ isActive }) =>
  `text-sm no-underline transition-colors ${
    isActive ? 'text-primary font-semibold' : 'text-gray-500 hover:text-primary'
  }`;

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="flex items-center justify-between px-6 py-3.5 bg-white/90 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
      <Link to="/" className="font-bold text-lg tracking-tight text-gray-900 no-underline">
        BookMate <span className="text-primary">AI</span>
      </Link>
      {isAuthenticated && (
        <div className="flex items-center gap-6">
          <NavLink to="/chat" className={navLinkClass}>Chat</NavLink>
          <NavLink to="/dashboard" className={navLinkClass}>My Appointments</NavLink>
          <span className="text-sm text-gray-400 hidden sm:inline">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 text-sm font-medium rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}