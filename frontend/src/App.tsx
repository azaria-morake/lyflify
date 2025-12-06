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
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

function App() {
  const user = useAuthStore((state) => state.user);

  const isStaff = user?.role === 'CLINIC' || user?.role === 'DOCTOR';
  const isPatient = user?.role === 'PATIENT';

  return (
   <QueryClientProvider client={queryClient}>
    <Toaster position="top-center" richColors />
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

        <Route path="/" element={
          !user ? <Navigate to="/login" /> : 
          isPatient ? <PatientLayout /> : 
          isStaff ? <ClinicLayout /> : 
          <Navigate to="/login" /> // Fallback: If role is weird, kick to login
        }>
          {/* Nested Routes */}
          {isPatient && (
          <>
            <Route index element={<PatientHome />} />
            <Route path="triage" element={<TriageChat />} />
            <Route path="records" element={<PatientRecords />} />
          </>
          )}

          {isStaff && (
             <>
               <Route index element={<ClinicDashboard />} />
               <Route path="analytics" element={<ClinicAnalytics />} />
               <Route path="patients" element={<ClinicPatients />} />
             </>
          )}
        </Route>
      </Routes>
    </BrowserRouter>
   </QueryClientProvider>
  );
}

export default App;