import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MedicineManager from './pages/MedicineManager';
import SymptomChecker from './pages/SymptomChecker';
import NutritionAnalyzer from './pages/NutritionAnalyzer';
import UserProfile from './pages/UserProfile';
import PhysioBot from './pages/PhysioBot';
import RespiroScan from './pages/RespiroScan';
import MirrorCheck from './pages/MirrorCheck';
import Login from './pages/Login';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/medicines" element={<MedicineManager />} />
                    <Route path="/symptoms" element={<SymptomChecker />} />
                    <Route path="/nutrition" element={<NutritionAnalyzer />} />
                    <Route path="/physio" element={<PhysioBot />} />
                    <Route path="/respiro" element={<RespiroScan />} />
                    <Route path="/mirror-check" element={<MirrorCheck />} />
                    <Route path="/profile" element={<UserProfile />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </AccessibilityProvider>
    </AuthProvider>
  );
}

export default App;
