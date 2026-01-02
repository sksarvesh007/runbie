import { create } from 'zustand';

const useSessionStore = create((set, get) => ({
  currentSession: null,
  isRunning: false,
  isPaused: false,
  routePoints: [],
  distanceRun: 0,
  distanceEaten: 0,
  currentPace: 0,
  elapsedTime: 0,
  zombieDistance: 0,
  zombieGap: 0,
  catchCount: 0,
  isCaught: false,
  catchEvents: [],
  zombieStatus: 'safe',
  totalDistanceEaten: 0,
  
  startSession: (sessionData) => set({
    currentSession: sessionData,
    isRunning: true,
    isPaused: false,
    routePoints: [],
    distanceRun: 0,
    distanceEaten: 0,
    currentPace: 0,
    elapsedTime: 0,
    zombieDistance: 0,
    zombieGap: 0,
    catchCount: 0,
    isCaught: false,
    catchEvents: [],
    zombieStatus: 'safe',
    totalDistanceEaten: 0,
  }),
  
  pauseSession: () => set({ isPaused: true }),
  
  resumeSession: () => set({ isPaused: false }),
  
  stopSession: () => set({
    isRunning: false,
    isPaused: false,
  }),
  
  addRoutePoint: (point) => set((state) => ({
    routePoints: [...state.routePoints, point],
  })),
  
  updateDistance: (distance) => set({ distanceRun: distance }),
  
  updatePace: (pace) => set({ currentPace: pace }),
  
  updateElapsedTime: (time) => set({ elapsedTime: time }),
  
  updateZombieDistance: (distance) => set({ zombieDistance: distance }),
  
  incrementCatchCount: () => set((state) => ({
    catchCount: state.catchCount + 1,
  })),
  
  addEatenDistance: (distance) => set((state) => ({
    distanceEaten: state.distanceEaten + distance,
    totalDistanceEaten: state.totalDistanceEaten + distance,
  })),

  updateZombieGap: (gap) => set({ zombieGap: gap }),

  setIsCaught: (caught) => set({ isCaught: caught }),

  updateZombieStatus: (status) => set({ zombieStatus: status }),

  addCatchEvent: (event) => set((state) => ({
    catchEvents: [...state.catchEvents, event],
    catchCount: state.catchCount + 1,
  })),

  getEffectiveDistance: () => {
    const state = get();
    return Math.max(0, state.distanceRun - state.totalDistanceEaten);
  },
  
  resetSession: () => set({
    currentSession: null,
    isRunning: false,
    isPaused: false,
    routePoints: [],
    distanceRun: 0,
    distanceEaten: 0,
    currentPace: 0,
    elapsedTime: 0,
    zombieDistance: 0,
    zombieGap: 0,
    catchCount: 0,
    isCaught: false,
    catchEvents: [],
    zombieStatus: 'safe',
    totalDistanceEaten: 0,
  }),
}));

export default useSessionStore;
