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


function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />

        <Route path="/prescription" element={
          <PrivateRoute><PrescriptionAnalysis /></PrivateRoute>
        } />

        <Route path="/profile-setup" element={
          <PrivateRoute><ProfileSetup /></PrivateRoute>
        } />

        <Route path="/rehabilitation" element={
          <PrivateRoute><Rehabilitation /></PrivateRoute>
        } />

        <Route path="/chat" element={
          <PrivateRoute><Chat /></PrivateRoute>
        } />

        <Route path="/" element={<Landing />} />  {/* ← Navigate 대신 Landing */}

        <Route path="/result/:id" element={
          <PrivateRoute><AnalysisResult /></PrivateRoute>
        } />

        <Route path="/history" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />

        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}
