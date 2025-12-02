import { create } from 'zustand';

type UserRole = 'PATIENT' | 'PROVIDER' | null;

interface AuthState {
  user: { name: string; role: UserRole } | null;
  login: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, 
  login: (role) => {
    // Simulate Login
    const name = role === 'PATIENT' ? "Thabo" : "Dr. Nkosi";
    set({ user: { name, role } });
  },
  logout: () => set({ user: null }),
}));