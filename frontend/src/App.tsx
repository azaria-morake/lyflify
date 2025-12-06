import TriageChat from '@/pages/patient/TriageChat';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import PatientLayout from '@/layouts/PatientLayout';
import ClinicLayout from '@/layouts/ClinicLayout';
import Login from '@/pages/Login';
import PatientHome from '@/pages/patient/Home';
import ClinicDashboard from '@/pages/clinic/Dashboard';
import PatientRecords from '@/pages/patient/Records';
import ClinicAnalytics from '@/pages/clinic/Analytics';
import ClinicPatients from '@/pages/clinic/Patients';

const queryClient = new QueryClient(); // Initialize client

function App() {
  const user = useAuthStore((state) => state.user);

  return (
   <QueryClientProvider client={queryClient}> {/* WRAPPER 1 */}
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
          <>
            <Route index element={<PatientHome />} />
            <Route path="triage" element={<TriageChat />} />
            <Route path="records" element={<PatientRecords />} />
          </>
          )}

          {user?.role === 'PROVIDER' && (
             <>
               <Route index element={<ClinicDashboard />} />
               <Route path="analytics" element={<ClinicAnalytics />} />
               <Route path="patients" element={<ClinicPatients />} />
             </>
          )}
        </Route>
      </Routes>
    </BrowserRouter>
   </QueryClientProvider> // WRAPPER 1
  );
}

export default App;
