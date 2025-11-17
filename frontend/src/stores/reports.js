import { defineStore } from 'pinia';
import { ref } from 'vue';
import { reportsAPI } from '@/services/reports.api';
import { io } from 'socket.io-client';

export const useReportsStore = defineStore('reports', () => {
  // ========== State ==========

  // Analytics data (dashboard stats)
  const analytics = ref({
    rcSuccess: 0,
    rcInProgress: 0,
    dcSuccess: 0,
    dcInProgress: 0,
    dcFailed: 0,
    totalCommands: 0,
    lastUpdated: null
  });

  const nocsData = ref([]);
  const analyticsLoading = ref(false);
  const analyticsError = ref(null);

  // Separate loading state for NOCS data
  const nocsDataLoading = ref(false);
  const nocsDataError = ref(null);

  // Real-time state
  const socket = ref(null);
  const isRealtimeEnabled = ref(localStorage.getItem('realtimeEnabled') === 'true');
  const isRealtimeConnected = ref(false);

  // Meter-wise command data
  const meterData = ref([]);
  const meterDataLoading = ref(false);
  const meterDataError = ref(null);
  const meterDataLastUpdated = ref(null);

  // ========== Actions ==========

  /**
   * Fetch Dashboard Stats ONLY (Fast Query)
   * Loads RC/DC summary statistics - shows immediately
   */
  const fetchDashboardStats = async () => {
    analyticsLoading.value = true;
    analyticsError.value = null;

    try {
      // Fetch aggregated counts for overall statistics (fast, efficient)
      const countResponse = await reportsAPI.getDailyConnectDisconnectCount();
      let countData = countResponse.data;
      if (countData.data) {
        countData = countData.data;
      }

      if (!Array.isArray(countData)) {
        console.error('[Reports Store] Count response is not an array:', countData);
        throw new Error('Invalid response format from server');
      }

      console.log('[Reports Store] Daily count data:', countData);

      // Initialize stats
      const stats = {
        rcSuccess: 0,
        rcInProgress: 0,
        dcSuccess: 0,
        dcInProgress: 0,
        dcFailed: 0,
        totalCommands: 0,
        lastUpdated: new Date()
      };

      // Process aggregated count data
      countData.forEach((row) => {
        const commandType = row.BUS_OBJ_CD?.trim();
        const commandStatus = row.BO_STATUS_CD?.trim();
        const count = parseInt(row.COUNT) || 0;

        stats.totalCommands += count;

        if (commandType === 'D1-RemoteConnect' && commandStatus === 'COMPLETED') {
          stats.rcSuccess = count;
        } else if (commandType === 'D1-RemoteConnect' && commandStatus === 'COMINPROG') {
          stats.rcInProgress = count;
        } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'COMPLETED') {
          stats.dcSuccess = count;
        } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'COMINPROG') {
          stats.dcInProgress = count;
        } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'DISCARDED') {
          stats.dcFailed = count;
        }
      });

      console.log('[Reports Store] Dashboard stats loaded:', stats);

      analytics.value = stats;
      analyticsError.value = null;

      return { success: true, message: 'Dashboard stats loaded successfully' };
    } catch (err) {
      console.error('[Reports Store] Error fetching dashboard stats:', err);
      const errorMsg = err.response?.data?.message || err.message;
      analyticsError.value = errorMsg;
      return { success: false, message: 'Failed to fetch dashboard stats' };
    } finally {
      analyticsLoading.value = false;
    }
  };

  /**
   * Fetch NOCS Data (Slow Query)
   * Loads detailed NOCS breakdown - loads in background
   */
  const fetchNocsData = async () => {
    nocsDataLoading.value = true;
    nocsDataError.value = null;

    try {
      // Fetch aggregated NOCS data
      const nocsResponse = await reportsAPI.getRCDCNocsAggregated();
      console.log('[Reports Store] NOCS raw response:', nocsResponse);

      let nocsRawData = nocsResponse.data;
      console.log('[Reports Store] NOCS response.data:', nocsRawData);

      if (nocsRawData.data) {
        nocsRawData = nocsRawData.data;
        console.log('[Reports Store] NOCS extracted data array:', nocsRawData);
      }

      if (!Array.isArray(nocsRawData)) {
        console.error('[Reports Store] NOCS response is not an array:', nocsRawData);
        throw new Error('Invalid response format from server');
      }

      console.log(`[Reports Store] Processing ${nocsRawData.length} NOCS aggregated records...`);

      // Calculate NOCS-wise statistics from aggregated data
      const nocsMap = {};

      nocsRawData.forEach((row) => {
        const commandType = row.COMMAND_TYPE?.trim();
        const commandStatus = row.COMMAND_STATUS?.trim();
        const nocsName = row.NOCS_NAME?.trim() || 'Unknown NOCS';
        const count = parseInt(row.COMMAND_COUNT) || 0;

        // Initialize NOCS entry if it doesn't exist
        if (!nocsMap[nocsName]) {
          nocsMap[nocsName] = {
            nocsName,
            rcSuccess: 0,
            rcInProgress: 0,
            dcSuccess: 0,
            dcInProgress: 0,
            dcFailed: 0,
            total: 0
          };
        }

        // Add to total
        nocsMap[nocsName].total += count;

        // Distribute counts by command type and status
        if (commandType === 'D1-RemoteConnect' && commandStatus === 'COMPLETED') {
          nocsMap[nocsName].rcSuccess = count;
        } else if (commandType === 'D1-RemoteConnect' && commandStatus === 'COMINPROG') {
          nocsMap[nocsName].rcInProgress = count;
        } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'COMPLETED') {
          nocsMap[nocsName].dcSuccess = count;
        } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'COMINPROG') {
          nocsMap[nocsName].dcInProgress = count;
        } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'DISCARDED') {
          nocsMap[nocsName].dcFailed = count;
        }
      });

      // Convert NOCS map to array and sort by total commands
      const nocsArray = Object.values(nocsMap).sort((a, b) => b.total - a.total);

      console.log(`[Reports Store] NOCS data loaded: ${nocsArray.length} locations`);

      nocsData.value = nocsArray;
      nocsDataError.value = null;

      return { success: true, message: 'NOCS data loaded successfully' };
    } catch (err) {
      console.error('[Reports Store] Error fetching NOCS data:', err);
      const errorMsg = err.response?.data?.message || err.message;
      nocsDataError.value = errorMsg;
      return { success: false, message: 'Failed to fetch NOCS data' };
    } finally {
      nocsDataLoading.value = false;
    }
  };

  /**
   * Fetch All Analytics (Backward Compatibility)
   * Calls both dashboard stats and NOCS data
   */
  const fetchAnalytics = async () => {
    const [statsResult, nocsResult] = await Promise.all([
      fetchDashboardStats(),
      fetchNocsData()
    ]);

    const allSuccess = statsResult.success && nocsResult.success;
    return {
      success: allSuccess,
      message: allSuccess ? 'Analytics data refreshed successfully' : 'Some data failed to refresh'
    };
  };

  /**
   * Fetch meter-wise commands
   */
  const fetchMeterData = async () => {
    meterDataLoading.value = true;
    meterDataError.value = null;

    try {
      const response = await reportsAPI.getMeterWiseCommands();
      meterData.value = response.data.data;
      meterDataLastUpdated.value = new Date();
      meterDataError.value = null;

      return { success: true, message: 'Meter data refreshed successfully' };
    } catch (err) {
      console.error('[Reports Store] Error fetching meter data:', err);
      const errorMsg = err.response?.data?.message || err.message;
      meterDataError.value = errorMsg;
      return { success: false, message: 'Failed to fetch meter data' };
    } finally {
      meterDataLoading.value = false;
    }
  };

  /**
   * Fetch all data
   */
  const fetchAllData = async () => {
    const results = await Promise.all([
      fetchMeterData(),
      fetchAnalytics()
    ]);

    const allSuccess = results.every(r => r.success);
    return {
      success: allSuccess,
      message: allSuccess ? 'All data refreshed successfully' : 'Some data failed to refresh'
    };
  };

  // ========== Real-time Methods ==========

  /**
   * Initialize Socket.IO connection
   */
  const initializeSocket = () => {
    if (socket.value) {
      console.log('[Reports Store] Socket already initialized');
      return;
    }

    // Extract base URL without /api suffix
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    const socketUrl = apiUrl.replace('/api', ''); // Socket.IO runs on root, not /api
    console.log('[Reports Store] Connecting to Socket.IO:', socketUrl);

    socket.value = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Connection events
    socket.value.on('connect', () => {
      console.log('[Reports Store] Socket.IO connected:', socket.value.id);
      isRealtimeConnected.value = true;
    });

    socket.value.on('disconnect', () => {
      console.log('[Reports Store] Socket.IO disconnected');
      isRealtimeConnected.value = false;
    });

    socket.value.on('connect_error', (error) => {
      console.error('[Reports Store] Socket.IO connection error:', error);
      isRealtimeConnected.value = false;
    });

    // Listen for dashboard updates
    socket.value.on('dashboard:update', (data) => {
      console.log('[Reports Store] Received real-time update:', data);
      processRealtimeUpdate(data);
    });
  };

  /**
   * Disconnect Socket.IO
   */
  const disconnectSocket = () => {
    if (socket.value) {
      console.log('[Reports Store] Disconnecting Socket.IO');
      socket.value.disconnect();
      socket.value = null;
      isRealtimeConnected.value = false;
    }
  };

  /**
   * Process real-time data update
   */
  const processRealtimeUpdate = (data) => {
    const { countData, nocsData: nocsRawData, timestamp } = data;

    // Process count data for overall stats
    if (countData && Array.isArray(countData)) {
      const stats = {
        rcSuccess: 0,
        rcInProgress: 0,
        dcSuccess: 0,
        dcInProgress: 0,
        dcFailed: 0,
        totalCommands: 0,
        lastUpdated: new Date(timestamp)
      };

      countData.forEach((row) => {
        const commandType = row.BUS_OBJ_CD?.trim();
        const commandStatus = row.BO_STATUS_CD?.trim();
        const count = parseInt(row.COUNT) || 0;

        stats.totalCommands += count;

        if (commandType === 'D1-RemoteConnect' && commandStatus === 'COMPLETED') {
          stats.rcSuccess = count;
        } else if (commandType === 'D1-RemoteConnect' && commandStatus === 'COMINPROG') {
          stats.rcInProgress = count;
        } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'COMPLETED') {
          stats.dcSuccess = count;
        } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'COMINPROG') {
          stats.dcInProgress = count;
        } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'DISCARDED') {
          stats.dcFailed = count;
        }
      });

      analytics.value = stats;
    }

    // Process NOCS data
    if (nocsRawData && Array.isArray(nocsRawData)) {
      const nocsMap = {};

      nocsRawData.forEach((row) => {
        const commandType = row.COMMAND_TYPE?.trim();
        const commandStatus = row.COMMAND_STATUS?.trim();
        const nocsName = row.NOCS_NAME?.trim() || 'Unknown NOCS';
        const count = parseInt(row.COMMAND_COUNT) || 0;

        if (!nocsMap[nocsName]) {
          nocsMap[nocsName] = {
            nocsName,
            rcSuccess: 0,
            rcInProgress: 0,
            dcSuccess: 0,
            dcInProgress: 0,
            dcFailed: 0,
            total: 0
          };
        }

        nocsMap[nocsName].total += count;

        if (commandType === 'D1-RemoteConnect' && commandStatus === 'COMPLETED') {
          nocsMap[nocsName].rcSuccess = count;
        } else if (commandType === 'D1-RemoteConnect' && commandStatus === 'COMINPROG') {
          nocsMap[nocsName].rcInProgress = count;
        } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'COMPLETED') {
          nocsMap[nocsName].dcSuccess = count;
        } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'COMINPROG') {
          nocsMap[nocsName].dcInProgress = count;
        } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'DISCARDED') {
          nocsMap[nocsName].dcFailed = count;
        }
      });

      const nocsArray = Object.values(nocsMap).sort((a, b) => b.total - a.total);
      nocsData.value = nocsArray;

      console.log('[Reports Store] Real-time update processed - NOCS count:', nocsArray.length);
    }
  };

  /**
   * Enable real-time updates
   */
  const enableRealtime = async () => {
    try {
      isRealtimeEnabled.value = true;
      localStorage.setItem('realtimeEnabled', 'true');

      // Initialize socket if not already done
      initializeSocket();

      // Start backend polling
      await reportsAPI.startRealtime();

      console.log('[Reports Store] Real-time updates enabled');
      return { success: true, message: 'Real-time updates enabled' };
    } catch (error) {
      console.error('[Reports Store] Error enabling real-time:', error);
      isRealtimeEnabled.value = false;
      localStorage.setItem('realtimeEnabled', 'false');
      return { success: false, message: 'Failed to enable real-time updates' };
    }
  };

  /**
   * Disable real-time updates
   */
  const disableRealtime = async () => {
    try {
      isRealtimeEnabled.value = false;
      localStorage.setItem('realtimeEnabled', 'false');

      // Stop backend polling
      await reportsAPI.stopRealtime();

      // Disconnect socket
      disconnectSocket();

      console.log('[Reports Store] Real-time updates disabled');
      return { success: true, message: 'Real-time updates disabled' };
    } catch (error) {
      console.error('[Reports Store] Error disabling real-time:', error);
      return { success: false, message: 'Failed to disable real-time updates' };
    }
  };

  /**
   * Toggle real-time updates
   */
  const toggleRealtime = async () => {
    if (isRealtimeEnabled.value) {
      return await disableRealtime();
    } else {
      return await enableRealtime();
    }
  };

  // ========== Return ==========

  return {
    // Analytics
    analytics,
    nocsData,
    analyticsLoading,
    analyticsError,
    fetchAnalytics,

    // Progressive Loading
    fetchDashboardStats,
    fetchNocsData,
    nocsDataLoading,
    nocsDataError,

    // Meter data
    meterData,
    meterDataLoading,
    meterDataError,
    meterDataLastUpdated,
    fetchMeterData,

    // Combined
    fetchAllData,

    // Real-time
    isRealtimeEnabled,
    isRealtimeConnected,
    enableRealtime,
    disableRealtime,
    toggleRealtime,
    initializeSocket,
    disconnectSocket
  };
});
