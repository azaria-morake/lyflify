import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. Define the new Roles
type UserRole = 'PATIENT' | 'CLINIC' | 'DOCTOR' | null;

interface AuthState {
  user: { name: string; role: UserRole; id: string } | null;
  login: (email: string) => void; // Accepts Email string
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, 
      login: (email) => {
        let role: UserRole = 'PATIENT';
        let name = "Thabo";
        
        // 2. Logic to assign roles based on email
        if (email.includes('admin') || email.includes('clinic')) {
          role = 'CLINIC';
          name = "Sister Betty";
        } else if (email.includes('dr')) {
          role = 'DOCTOR';
          name = "Dr. Zulu";
        }

        set({ user: { name, role, id: email } });
      },
      logout: () => set({ user: null }),
    }),
    {
      name: 'lyflify-auth-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);