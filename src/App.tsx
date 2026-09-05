/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';

// Auth pages (public)
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

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public routes ─────────────────────────────────── */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ── Protected routes ──────────────────────────────── */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
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
