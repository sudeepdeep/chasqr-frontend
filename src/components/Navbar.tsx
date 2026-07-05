import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Rocket, LogOut, Shield, Receipt, Headset, BookOpen } from 'lucide-react';
import { AuthStore, clearAuth } from '../store/auth';

const linkClass = (active: boolean) =>
  `flex items-center gap-1.5 text-sm font-medium transition-colors ${
    active ? 'text-primary' : 'text-slate-600 hover:text-primary'
  }`;

export default function Navbar() {
  const { user } = AuthStore.useState();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bebas text-2xl text-primary tracking-widest">
          <img src="/logo.svg" alt="Chasqr" className="w-7 h-7" />
          CHASQR
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/docs" className={linkClass(pathname === '/docs')}>
            <BookOpen size={15} />
            Docs
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className={linkClass(pathname === '/dashboard')}>
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
              <Link to="/transactions" className={linkClass(pathname === '/transactions')}>
                <Receipt size={15} />
                Transactions
              </Link>
              {user.role === 'expert' && (
                <Link to="/expert" className={linkClass(pathname === '/expert')}>
                  <Headset size={15} />
                  Expert Panel
                </Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" className={linkClass(pathname === '/admin')}>
                  <Shield size={15} />
                  Admin
                </Link>
              )}
              <Link
                to="/upload"
                className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                  pathname === '/upload'
                    ? 'bg-primary-dark text-white'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                <Rocket size={14} />
                Deploy
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
