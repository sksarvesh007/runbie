import { create } from 'zustand';

const useAuthStore = create(set => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: user => set({ user, isAuthenticated: !!user, isLoading: false }),

  clearUser: () =>
    set({ user: null, isAuthenticated: false, isLoading: false }),

  setLoading: isLoading => set({ isLoading }),

  updateUserProfile: updates =>
    set(state => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}));

export default useAuthStore;
