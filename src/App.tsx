import { GoogleOAuthProvider } from '@react-oauth/google';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import AppLayout from './layout/AppLayout';
import AdminPanel from './pages/AdminPanel';
import Analytics from './pages/Analytics';
import Build from './pages/Build';
import Builder from './pages/Builder';
import Dashboard from './pages/Dashboard';
import Docs from './pages/Docs';
import ExpertPanel from './pages/ExpertPanel';
import ForgotPassword from './pages/ForgotPassword';
import GithubCallback from './pages/GithubCallback';
import ImportGithub from './pages/ImportGithub';
import Landing3D from './pages/Landing3D';
import LandingV2 from './pages/LandingV2';
import Login from './pages/Login';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import SeoChecker from './pages/SeoChecker';
import SiteAdmin from './pages/SiteAdmin';
import Terms from './pages/Terms';
import Transactions from './pages/Transactions';
import Upload from './pages/Upload';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  // Outside ProtectedRoute on purpose — the user isn't signed in yet when
  // GitHub redirects them back here.
  { path: '/auth/github/callback', element: <GithubCallback /> },
  {
    path: '/sites/:siteId/builder',
    element: <ProtectedRoute><Builder /></ProtectedRoute>,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // Signed-in users never see the marketing page — they land on the dashboard.
      { path: '/', element: <PublicOnlyRoute><Landing3D /></PublicOnlyRoute> },
      // Previous landing, kept reachable while the 3D page beds in.
      { path: '/v2', element: <LandingV2 /> },
      // Alternate landing page, live alongside the current one while we pick.
      // { path: '/v2', element: <LandingV2 /> },
      // { path: '/v3', element: <LandingV3 /> },
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
        path: '/analytics',
        element: <ProtectedRoute><Analytics /></ProtectedRoute>,
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
        path: '/build',
        element: <ProtectedRoute><Build /></ProtectedRoute>,
      },
      {
        path: '/import/github',
        element: <ProtectedRoute><ImportGithub /></ProtectedRoute>,
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
