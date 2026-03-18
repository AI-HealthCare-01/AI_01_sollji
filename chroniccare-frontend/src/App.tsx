import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrescriptionAnalysis from './pages/PrescriptionAnalysis';
import ProfileSetup from './pages/profileSetup';
import Rehabilitation from './pages/Rehabilitation';
import Chat from './pages/Chat';
import Landing from './pages/Landing';
import AnalysisResult from './pages/AnalysisResult';
import Register from './pages/Register';
import MyPage from './pages/MyPage';
import HealthProfile from './pages/HealthProfile';


function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isProfileCompleted } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isProfileCompleted) return <Navigate to="/profile-setup" />;

  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* profile-setup: 로그인은 필요하지만 profileCompleted 체크는 안 함 */}
        <Route path="/profile-setup" element={
          isAuthenticated ? <ProfileSetup /> : <Navigate to="/login" />
        } />

        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />

        <Route path="/prescription" element={
          <PrivateRoute><PrescriptionAnalysis /></PrivateRoute>
        } />

        <Route path="/rehabilitation" element={
          <PrivateRoute><Rehabilitation /></PrivateRoute>
        } />

        <Route path="/chat" element={
          <PrivateRoute><Chat /></PrivateRoute>
        } />

        <Route path="/result/:id" element={
          <PrivateRoute><AnalysisResult /></PrivateRoute>
        } />

        <Route path="/history" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />

        <Route path="/mypage" element={
          <PrivateRoute><MyPage /></PrivateRoute>
        } />

        <Route path="/health-profile" element={
          <PrivateRoute><HealthProfile /></PrivateRoute>
        } />

      </Routes>
    </BrowserRouter>
  );
}
