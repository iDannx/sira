import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Automations } from './pages/Automations';
import { Cartera } from './pages/Cartera';
import { Estrategias } from './pages/Estrategias';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NotFound } from './pages/NotFound';

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/automations" element={<Protected><Automations /></Protected>} />
        <Route path="/estrategias" element={<Protected><Estrategias /></Protected>} />

        <Route path="/cartera" element={<Protected><Cartera /></Protected>} />
        <Route path="/acuerdos" element={<Protected><PlaceholderPage title="Acuerdos" /></Protected>} />
        <Route path="/gestiones" element={<Protected><PlaceholderPage title="Gestiones" /></Protected>} />
        <Route path="/predictive-risk" element={<Protected><PlaceholderPage title="Predicción de Riesgo" /></Protected>} />
        <Route path="/reports" element={<Protected><PlaceholderPage title="Reportes" /></Protected>} />
        <Route path="/settings" element={<Protected><PlaceholderPage title="Configuración" /></Protected>} />

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h2 className="text-4xl font-bold text-navy-dark">{title}</h2>
      <p className="text-slate-500 font-medium">Esta sección está en desarrollo para SIRA Premium.</p>
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
      </div>
    </div>
  );
}
