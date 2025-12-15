import { create } from 'zustand';
import { Phase, Gesture } from './types';

interface AppState {
  phase: Phase;
  gesture: Gesture;
  cameraActive: boolean;
  activePhotoIndex: number | null; // Null means no specific photo focused
  
  setPhase: (phase: Phase) => void;
  setGesture: (gesture: Gesture) => void;
  toggleCamera: () => void;
  setActivePhotoIndex: (index: number | null) => void;
  
  // Helpers to cycle phases based on gestures or animation completion
  triggerBloom: () => void;
  triggerCollapse: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  phase: 'tree',
  gesture: 'None',
  cameraActive: true, // Camera enabled by default
  activePhotoIndex: null,

  setPhase: (phase) => set({ phase }),
  setGesture: (gesture) => {
    const { phase, triggerBloom, triggerCollapse } = get();
    set({ gesture });

    // Gesture Logic
    if (gesture === 'Open_Palm' && phase === 'tree') {
      triggerBloom();
    }
    if (gesture === 'Closed_Fist' && phase === 'nebula') {
      triggerCollapse();
    }
  },
  toggleCamera: () => set((state) => ({ cameraActive: !state.cameraActive })),
  setActivePhotoIndex: (index) => set({ activePhotoIndex: index }),

  triggerBloom: () => {
    const { phase } = get();
    if (phase === 'tree') {
      set({ phase: 'blooming' });
      // Transition logic is handled in the component via GSAP, 
      // which will call setPhase('nebula') on complete
    }
  },

  triggerCollapse: () => {
    const { phase } = get();
    if (phase === 'nebula') {
      set({ phase: 'collapsing' });
    }
  }
}));