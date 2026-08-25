import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
      <Link to="/" className="font-bold text-lg text-gray-900 no-underline">
        BookMate AI
      </Link>
      {isAuthenticated && (
        <div className="flex items-center gap-5">
          <Link to="/chat" className="text-sm text-gray-500 hover:text-primary no-underline">Chat</Link>
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-primary no-underline">My Appointments</Link>
          <span className="text-sm text-gray-500">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}