import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Rocket, LogOut, Shield, Receipt, Headset, BookOpen, Search } from 'lucide-react';
import { AuthStore, clearAuth } from '../store/auth';
import { getSocket } from '../lib/socket';
import { getMyRequestsAPI } from '../api/support.api';
import { SupportUnreadStore, incrementUnread, totalUnread } from '../store/supportUnread';

const linkClass = (active: boolean) =>
  `flex items-center gap-1.5 text-sm font-medium transition-colors ${
    active ? 'text-primary' : 'text-slate-600 hover:text-primary'
  }`;

export default function Navbar() {
  const { user } = AuthStore.useState();
  const unreadState = SupportUnreadStore.useState();
  const expertUnread = totalUnread(unreadState);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  // Experts can have several conversations going at once — join every open
  // request's room (not just whichever one is open in the Expert Panel) so
  // unread counts keep accumulating no matter what page the expert is on.
  useEffect(() => {
    if (!user || user.role !== 'expert') return;
    const socket = getSocket();
    const joinedIds = new Set<string>();

    const joinOpenRequests = () => {
      getMyRequestsAPI()
        .then((res) => {
          res.data.data.requests
            .filter((r: any) => ['pending', 'accepted'].includes(r.status))
            .forEach((r: any) => {
              if (!joinedIds.has(r._id)) {
                socket.emit('join', r._id);
                joinedIds.add(r._id);
              }
            });
        })
        .catch(() => {});
    };

    joinOpenRequests();
    socket.on('connect', joinOpenRequests);
    socket.on('new-request', joinOpenRequests);

    const onMessage = (msg: any) => {
      const { openRequestId } = SupportUnreadStore.getRawState();
      if (msg.senderId?._id !== user.id && msg.requestId !== openRequestId) {
        incrementUnread(msg.requestId);
      }
    };
    socket.on('message', onMessage);

    return () => {
      socket.off('connect', joinOpenRequests);
      socket.off('new-request', joinOpenRequests);
      socket.off('message', onMessage);
    };
  }, [user]);

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
          <Link to="/seo-checker" className={linkClass(pathname === '/seo-checker')}>
            <Search size={15} />
            SEO Checker
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
                <Link to="/expert" className={`${linkClass(pathname === '/expert')} relative`}>
                  <Headset size={15} />
                  Expert Panel
                  {expertUnread > 0 && (
                    <span className="absolute -top-2 -right-3 min-w-[16px] h-4 px-1 flex items-center justify-center bg-primary text-white text-[10px] font-semibold rounded-full">
                      {expertUnread > 9 ? '9+' : expertUnread}
                    </span>
                  )}
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
              <Link
                to="/profile"
                title="My Profile"
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bebas text-sm shrink-0 transition-colors ${
                  pathname === '/profile'
                    ? 'bg-primary text-white'
                    : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
                }`}
              >
                {user.name?.[0]?.toUpperCase() || '?'}
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
