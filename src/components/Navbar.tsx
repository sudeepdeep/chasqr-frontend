import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, LogOut, Shield, Receipt, Headset, BookOpen, Search, BarChart3 } from 'lucide-react';
import { AuthStore, clearAuth } from '../store/auth';
import { getSocket } from '../lib/socket';
import { getMyRequestsAPI } from '../api/support.api';
import { SupportUnreadStore, incrementUnread, totalUnread } from '../store/supportUnread';
import { NavOverlayStore } from '../store/navOverlay';

const linkClass = (active: boolean, overlay: boolean) => {
  const tone = overlay
    ? active
      ? 'text-white'
      : 'text-white/75 hover:text-white'
    : active
      ? 'text-primary'
      : 'text-slate-600 hover:text-primary';
  return `flex items-center gap-1.5 text-sm font-medium transition-colors ${tone}`;
};

export default function Navbar() {
  const { user } = AuthStore.useState();
  const unreadState = SupportUnreadStore.useState();
  const expertUnread = totalUnread(unreadState);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Set by whichever LandingBanner is on screen: true only while the dark
  // banner is still behind the bar. Once the page scrolls on to the white
  // sections it flips back, otherwise white links would land on white content.
  const { active: overlay } = NavOverlayStore.useState();

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
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        overlay
          ? 'bg-transparent border-b border-white/10'
          : 'glass dark:glass-dark border-b border-slate-100'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className={`flex items-center gap-2 font-bebas text-2xl tracking-widest transition-colors ${
            overlay ? 'text-white' : 'text-primary'
          }`}
        >
          <img src="/logo.svg" alt="Chasqr" className="w-7 h-7" />
          CHASQR
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/docs" className={linkClass(pathname === '/docs', overlay)}>
            <BookOpen size={15} />
            Docs
          </Link>
          <Link to="/seo-checker" className={linkClass(pathname === '/seo-checker', overlay)}>
            <Search size={15} />
            SEO Checker
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className={linkClass(pathname === '/dashboard', overlay)}>
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
              <Link to="/analytics" className={linkClass(pathname === '/analytics', overlay)}>
                <BarChart3 size={15} />
                Analytics
              </Link>
              <Link to="/transactions" className={linkClass(pathname === '/transactions', overlay)}>
                <Receipt size={15} />
                Transactions
              </Link>
              {user.role === 'expert' && (
                <Link to="/expert" className={`${linkClass(pathname === '/expert', overlay)} relative`}>
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
                <Link to="/admin" className={linkClass(pathname === '/admin', overlay)}>
                  <Shield size={15} />
                  Admin
                </Link>
              )}
              <Link
                to="/profile"
                title="My Profile"
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bebas text-sm shrink-0 transition-colors ${
                  pathname === '/profile'
                    ? 'bg-primary text-white'
                    : overlay
                      ? 'bg-white/15 text-white hover:bg-white hover:text-slate-900'
                      : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
                }`}
              >
                {user.name?.[0]?.toUpperCase() || '?'}
              </Link>
              <button
                onClick={handleLogout}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  overlay
                    ? 'text-white/75 hover:text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`text-sm font-medium transition-colors ${
                  overlay
                    ? 'text-white/75 hover:text-white'
                    : 'text-slate-600 hover:text-primary'
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                  overlay
                    ? 'bg-white text-slate-900 hover:bg-white/90'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
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
