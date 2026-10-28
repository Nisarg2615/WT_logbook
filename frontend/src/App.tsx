import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/EquipmentList';
import MyLogbooks from './pages/MyLogbooks';
import LogbookForm from './pages/LogbookForm';
import ReviewQueue from './pages/ReviewQueue';
import Alerts from './pages/Alerts';
import ShiftHandovers from './pages/ShiftHandovers';
import AuditTrail from './pages/AuditTrail';
import Reports from './pages/Reports';
import PlantAnalytics from './pages/PlantAnalytics';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<AppShell />}>
          {/* Default redirect based on auth */}
          <Route index element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } />
          
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="equipment" element={<EquipmentList />} />
          <Route path="logbooks" element={<MyLogbooks />} />
          <Route path="logbooks/:id" element={<LogbookForm />} />
          <Route path="reviews" element={<ReviewQueue />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="handovers" element={<ShiftHandovers />} />
          <Route path="audit" element={<AuditTrail />} />
          <Route path="analytics" element={<PlantAnalytics />} />
          <Route path="compliance" element={<Reports />} />
          <Route path="reports" element={<Reports />} />
          
          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
