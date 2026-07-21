import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';

// Lazy loaded page components
const Login = lazy(() => import('../pages/Login.jsx'));
const Register = lazy(() => import('../pages/Register.jsx'));
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const Workouts = lazy(() => import('../pages/Workouts.jsx'));
const Habits = lazy(() => import('../pages/Habits.jsx'));
const Progress = lazy(() => import('../pages/Progress.jsx'));
const Settings = lazy(() => import('../pages/Settings.jsx'));
const ErrorPage = lazy(() => import('../pages/ErrorPage.jsx'));

// Premium fall-back spinner matching dark theme styles
const RouteFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#0F0F1A]">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#6C63FF] border-t-transparent"></div>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes wrapped in DashboardLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="habits" element={<Habits />} />
          <Route path="progress" element={<Progress />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
