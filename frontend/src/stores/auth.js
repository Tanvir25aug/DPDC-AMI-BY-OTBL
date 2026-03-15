import { defineStore } from 'pinia';
import api from '@/services/api';

// Routes always accessible regardless of page access config
const ALWAYS_ACCESSIBLE = new Set(['dashboard', 'profile', 'login', 'home', 'not-found', 'admin']);

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    isAuthenticated: false,
    // pageAccess: { routeName -> { allowed_roles: [...] } }
    pageAccess: JSON.parse(localStorage.getItem('pageAccess') || '{}')
  }),

  getters: {
    currentUser: (state) => state.user,
    userRole: (state) => state.user?.role?.name || null,
    userPermissions: (state) => state.user?.role?.permissions || {},
    hasPermission: (state) => (permission) => {
      return state.user?.role?.permissions?.[permission] || false;
    },
    isAdmin: (state) => state.user?.role?.name === 'admin',

    /**
     * Returns true if the current user's role is allowed to access the given route name.
     * Admin always has access to everything.
     */
    canAccessPage: (state) => (routeName) => {
      if (!routeName) return true;
      if (ALWAYS_ACCESSIBLE.has(routeName)) return true;
      if (state.user?.role?.name === 'admin') return true;

      const config = state.pageAccess[routeName];
      if (!config) return true; // Not configured = accessible by default

      const userRole = state.user?.role?.name;
      return config.allowed_roles.includes(userRole);
    }
  },

  actions: {
    async login(credentials) {
      try {
        const response = await api.post('/auth/login', credentials);
        const { user, token, refreshToken } = response.data.data;

        this.user = user;
        this.token = token;
        this.refreshToken = refreshToken;
        this.isAuthenticated = true;

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        // Fetch page access config right after login
        await this.fetchPageAccess();

        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Login failed'
        };
      }
    },

    async logout() {
      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.clearAuth();
      }
    },

    clearAuth() {
      this.user = null;
      this.token = null;
      this.refreshToken = null;
      this.isAuthenticated = false;
      this.pageAccess = {};

      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('pageAccess');
    },

    async fetchProfile() {
      try {
        const response = await api.get('/auth/profile');
        this.user = response.data.data;
        this.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(this.user));
      } catch (error) {
        this.clearAuth();
        throw error;
      }
    },

    async changePassword(passwords) {
      try {
        const response = await api.post('/auth/change-password', passwords);
        return { success: true, message: response.data.message };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Password change failed'
        };
      }
    },

    /**
     * Fetch page access config from backend and cache in state + localStorage.
     * Called after login and can be called by admin after saving changes.
     */
    async fetchPageAccess() {
      try {
        const response = await api.get('/page-access');
        const configs = response.data.data;

        // Convert array to map: { routeName -> config }
        const map = {};
        for (const cfg of configs) {
          map[cfg.route_name] = cfg;
        }
        this.pageAccess = map;
        localStorage.setItem('pageAccess', JSON.stringify(map));
      } catch (error) {
        // Non-fatal — fall back to cached or empty
        console.error('Failed to fetch page access config:', error);
      }
    },

    initializeAuth() {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      const pageAccess = localStorage.getItem('pageAccess');

      if (token && user) {
        this.token = token;
        this.user = JSON.parse(user);
        this.isAuthenticated = true;
      }

      if (pageAccess) {
        this.pageAccess = JSON.parse(pageAccess);
      }
    }
  }
});
