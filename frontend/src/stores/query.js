import { defineStore } from 'pinia';
import api from '@/services/api';

export const useQueryStore = defineStore('query', {
  state: () => ({
    queryResults: null,
    queryHistory: [],
    statistics: null,
    loading: false,
    error: null,
    metadata: null
  }),

  actions: {
    async executeQuery(query, maxRows = 1000) {
      this.loading = true;
      this.error = null;

      try {
        const response = await api.post('/queries/execute', {
          query,
          maxRows
        });

        this.queryResults = response.data.data;
        this.metadata = response.data.metadata;

        return { success: true, data: this.queryResults };
      } catch (error) {
        this.error = error.response?.data?.message || 'Query execution failed';
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    async exportQuery(query, format, maxRows = 10000) {
      this.loading = true;
      this.error = null;

      try {
        const response = await api.post('/queries/execute-export', {
          query,
          format,
          maxRows
        }, {
          responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        // Get filename from header or use default
        const contentDisposition = response.headers['content-disposition'];
        let filename = `report_${Date.now()}.${format}`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?(.+)"?/);
          if (match) filename = match[1];
        }

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || 'Export failed';
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    async exportData(data, format, title = 'Report') {
      this.loading = true;
      this.error = null;

      try {
        const response = await api.post('/queries/export', {
          data,
          format,
          title
        }, {
          responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        const contentDisposition = response.headers['content-disposition'];
        let filename = `report_${Date.now()}.${format}`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?(.+)"?/);
          if (match) filename = match[1];
        }

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || 'Export failed';
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    async fetchQueryHistory(options = {}) {
      this.loading = true;
      try {
        const params = {
          page: options.page || 1,
          limit: options.limit || 50,
          userId: options.userId,
          status: options.status,
          startDate: options.startDate,
          endDate: options.endDate
        };

        const response = await api.get('/queries/history', { params });
        this.queryHistory = response.data.data;

        return { success: true, data: response.data };
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch history';
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    async fetchStatistics(userId = null) {
      this.loading = true;
      try {
        const response = await api.get('/queries/statistics', {
          params: { userId }
        });
        this.statistics = response.data.data;

        return { success: true, data: this.statistics };
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch statistics';
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    clearResults() {
      this.queryResults = null;
      this.metadata = null;
      this.error = null;
    }
  }
});
