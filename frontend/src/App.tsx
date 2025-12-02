import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import PatientLayout from '@/layouts/PatientLayout';
import ClinicLayout from '@/layouts/ClinicLayout';
import Login from '@/pages/Login';
import PatientHome from '@/pages/patient/Home';
import ClinicDashboard from '@/pages/clinic/Dashboard';

function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

        <Route path="/" element={
          !user ? <Navigate to="/login" /> : 
          user.role === 'PATIENT' ? <PatientLayout /> : 
          <ClinicLayout />
        }>
          {/* Nested Routes */}
          {user?.role === 'PATIENT' && (
            <Route index element={<PatientHome />} />
          )}

          {user?.role === 'PROVIDER' && (
             <Route index element={<ClinicDashboard />} />
          )}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;