import { defineStore } from 'pinia';
import api from '@/services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    isAuthenticated: false
  }),

  getters: {
    currentUser: (state) => state.user,
    userRole: (state) => state.user?.role?.name || null,
    userPermissions: (state) => state.user?.role?.permissions || {},
    hasPermission: (state) => (permission) => {
      return state.user?.role?.permissions?.[permission] || false;
    },
    isAdmin: (state) => state.user?.role?.name === 'admin'
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

        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

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

      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
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

    initializeAuth() {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (token && user) {
        this.token = token;
        this.user = JSON.parse(user);
        this.isAuthenticated = true;
      }
    }
  }
});
