import { create } from 'zustand';

const useUserStore = create((set) => ({
  accountType: 'free',
  subscriptionPlan: null,
  subscriptionStatus: null,
  sessionsUsed: 0,
  maxSessions: 5,
  subscriptionEndDate: null,
  
  setAccountType: (accountType) => set({ accountType }),
  
  setSubscription: (subscription) => set({
    subscriptionPlan: subscription.plan,
    subscriptionStatus: subscription.status,
    subscriptionEndDate: subscription.endDate,
    accountType: 'premium',
    maxSessions: Infinity,
  }),
  
  clearSubscription: () => set({
    subscriptionPlan: null,
    subscriptionStatus: null,
    subscriptionEndDate: null,
    accountType: 'free',
    maxSessions: 5,
  }),
  
  incrementSessionsUsed: () => set((state) => ({
    sessionsUsed: state.sessionsUsed + 1,
  })),
  
  setSessionsUsed: (count) => set({ sessionsUsed: count }),
  
  canStartNewSession: () => {
    const state = useUserStore.getState();
    return state.accountType === 'premium' || state.sessionsUsed < state.maxSessions;
  },
  
  getRemainingSessions: () => {
    const state = useUserStore.getState();
    if (state.accountType === 'premium') return Infinity;
    return Math.max(0, state.maxSessions - state.sessionsUsed);
  },
}));

export default useUserStore;
