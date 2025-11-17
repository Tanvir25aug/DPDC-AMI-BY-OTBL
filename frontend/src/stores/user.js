import { defineStore } from 'pinia';
import api from '@/services/api';

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    roles: [],
    currentUser: null,
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0
    },
    loading: false,
    error: null
  }),

  actions: {
    async fetchUsers(options = {}) {
      this.loading = true;
      this.error = null;

      try {
        const params = {
          page: options.page || this.pagination.page,
          limit: options.limit || this.pagination.limit,
          search: options.search || '',
          role: options.role || null,
          isActive: options.isActive !== undefined ? options.isActive : null
        };

        const response = await api.get('/users', { params });
        this.users = response.data.data;
        this.pagination = response.data.pagination;

        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch users';
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    async fetchUserById(id) {
      this.loading = true;
      try {
        const response = await api.get(`/users/${id}`);
        this.currentUser = response.data.data;
        return { success: true, data: this.currentUser };
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch user';
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    async createUser(userData) {
      this.loading = true;
      try {
        const response = await api.post('/users', userData);
        await this.fetchUsers();
        return { success: true, data: response.data.data };
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create user';
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    async updateUser(id, userData) {
      this.loading = true;
      try {
        const response = await api.put(`/users/${id}`, userData);
        await this.fetchUsers();
        return { success: true, data: response.data.data };
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update user';
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    async deleteUser(id) {
      this.loading = true;
      try {
        await api.delete(`/users/${id}`);
        await this.fetchUsers();
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete user';
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    async fetchRoles() {
      try {
        const response = await api.get('/users/roles');
        this.roles = response.data.data;
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch roles';
        return { success: false, message: this.error };
      }
    }
  }
});
