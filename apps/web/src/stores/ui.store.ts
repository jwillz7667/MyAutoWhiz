import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Mobile menu
  mobileMenuOpen: boolean;

  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown>;

  // Toasts
  toasts: Toast[];

  // Search
  searchOpen: boolean;
  searchQuery: string;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      activeModal: null,
      modalData: {},
      toasts: [],
      searchOpen: false,
      searchQuery: '',

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleSidebarCollapse: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      toggleMobileMenu: () =>
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

      openModal: (modalId, data = {}) =>
        set({ activeModal: modalId, modalData: data }),

      closeModal: () => set({ activeModal: null, modalData: {} }),

      addToast: (toast) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { ...toast, id };

        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto-remove after duration
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }
      },

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      clearToasts: () => set({ toasts: [] }),

      setSearchOpen: (open) => set({ searchOpen: open }),

      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// Helper functions for toast notifications
export const toast = {
  success: (title: string, description?: string) =>
    useUIStore.getState().addToast({ type: 'success', title, description }),
  error: (title: string, description?: string) =>
    useUIStore.getState().addToast({ type: 'error', title, description }),
  warning: (title: string, description?: string) =>
    useUIStore.getState().addToast({ type: 'warning', title, description }),
  info: (title: string, description?: string) =>
    useUIStore.getState().addToast({ type: 'info', title, description }),
};
