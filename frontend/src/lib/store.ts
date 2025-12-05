import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type UserRole = 'PATIENT' | 'PROVIDER' | null;

interface AuthState {
  user: { name: string; role: UserRole } | null;
  login: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, 
      login: (role) => {
        // Simulate Login
        const name = role === 'PATIENT' ? "Thabo" : "Dr. Nkosi";
        set({ user: { name, role } });
      },
      logout: () => set({ user: null }),
    }),
    {
      name: 'lyflify-auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    },
  ),
);