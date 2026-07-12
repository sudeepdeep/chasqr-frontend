import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AppLayout from './layout/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Docs from './pages/Docs';
import SeoChecker from './pages/SeoChecker';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Upload from './pages/Upload';
import SiteAdmin from './pages/SiteAdmin';
import AdminPanel from './pages/AdminPanel';
import Transactions from './pages/Transactions';
import ExpertPanel from './pages/ExpertPanel';
import ProtectedRoute from './components/ProtectedRoute';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/docs', element: <Docs /> },
      { path: '/seo-checker', element: <SeoChecker /> },
      { path: '/terms', element: <Terms /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
      {
        path: '/dashboard',
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
      },
      {
        path: '/profile',
        element: <ProtectedRoute><Profile /></ProtectedRoute>,
      },
      {
        path: '/upload',
        element: <ProtectedRoute><Upload /></ProtectedRoute>,
      },
      {
        path: '/sites/:siteId',
        element: <ProtectedRoute><SiteAdmin /></ProtectedRoute>,
      },
      {
        path: '/transactions',
        element: <ProtectedRoute><Transactions /></ProtectedRoute>,
      },
      {
        path: '/expert',
        element: <ProtectedRoute expertOnly><ExpertPanel /></ProtectedRoute>,
      },
      {
        path: '/admin',
        element: <ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>,
      },
    ],
  },
]);

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <RouterProvider router={router} />
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
    </GoogleOAuthProvider>
  );
}
