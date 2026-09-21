/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';

// Auth & Landing pages (public)
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Protected app pages
import { Dashboard } from './pages/Dashboard';
import { Animals } from './pages/Animals';
import { AnimalDetails } from './pages/AnimalDetails';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { Analytics } from './pages/Analytics';
import { Alerts } from './pages/Alerts';
import { AddData } from './pages/AddData';
import { MilkData } from './pages/MilkData';
import { CMTTests } from './pages/CMTTests';
import { HealthRecords } from './pages/HealthRecords';
import { UdderAnalysis } from './pages/UdderAnalysis';
import { Devices } from './pages/Devices';
import { Reports } from './pages/Reports';
import { FarmMap } from './pages/FarmMap';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';

function RootRoute() {
  const { isAuthenticated, initialising } = useAuth();

  if (initialising) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#8A5B3D] animate-spin" />
          <p className="text-xs text-[#746E68]">Loading GoDrishti…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public routes ─────────────────────────────────── */}
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ── Root / Protected routes ───────────────────────── */}
            <Route path="/" element={<RootRoute />}>
              <Route index element={<Dashboard />} />
              <Route path="animals" element={<Animals />} />
              <Route path="animals/:id" element={<AnimalDetails />} />
              <Route path="live-monitoring" element={<LiveMonitoring />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="add-data" element={<AddData />} />
              <Route path="milk-data" element={<MilkData />} />
              <Route path="cmt-tests" element={<CMTTests />} />
              <Route path="health-records" element={<HealthRecords />} />
              <Route path="udder-analysis" element={<UdderAnalysis />} />
              <Route path="devices" element={<Devices />} />
              <Route path="reports" element={<Reports />} />
              <Route path="farm-map" element={<FarmMap />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
