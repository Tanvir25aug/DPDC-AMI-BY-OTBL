# RC/DC Dashboard - Complete Technical Documentation

## 📊 Overview

The **RC/DC Dashboard** is a real-time monitoring system for tracking Remote Connect (RC) and Remote Disconnect (DC) commands sent to prepaid electricity meters in the DPDC AMI system.

---

## 🎯 What Does RC/DC Mean?

### **Remote Connect (RC)**
- Command sent to **reconnect** electricity supply to a meter
- Used when customer recharges their prepaid account
- Status: `D1-RemoteConnect`

### **Remote Disconnect (DC)**
- Command sent to **disconnect** electricity supply from a meter
- Used when customer's prepaid balance runs out
- Status: `D1-RemoteDisconnect`

### **Command Statuses**
- **COMPLETED**: Command successfully executed
- **COMINPROG**: Command in progress (pending)
- **DISCARDED**: Command failed/rejected

---

## 🏗️ System Architecture

```
┌─────────────┐      HTTP Request       ┌─────────────┐      SQL Query      ┌─────────────┐
│   Browser   │  ──────────────────────> │   Backend   │  ─────────────────> │   Oracle    │
│  (Vue.js)   │                          │  (Node.js)  │                     │  Database   │
└─────────────┘                          └─────────────┘                     └─────────────┘
       │                                        │                                    │
       │                                        │                                    │
       ▼                                        ▼                                    ▼
  Displays stats                         Executes SQL                        Returns raw data
  in dashboard                           Returns JSON                        (today's commands)
```

---

## 📁 Backend Implementation

### **1. SQL Query File**

**Location:** `backend/reports/rc_dc_analytics_summary.sql`

```sql
select /*+ FIRST_ROWS(1000) */
l.BUS_OBJ_CD COMMAND_TYPE,
l.BO_STATUS_CD COMMAND_STATUS,
vl.descr NOCS_NAME
from d1_activity l
inner join D1_ACTIVITY_REL_OBJ k on k.D1_ACTIVITY_ID=l.D1_ACTIVITY_ID and k.MAINT_OBJ_CD='D1-DEVICE'
inner join d1_dvc_cfg h on h.D1_DEVICE_ID=k.PK_VALUE1
inner join d1_install_evt g on g.DEVICE_CONFIG_ID=h.DEVICE_CONFIG_ID and g.d1_removal_dttm is null
inner join d1_sp_char f on f.d1_sp_id=g.d1_sp_id and f.char_type_cd='CM_LEGCY'
inner join ci_sp_char e on e.srch_char_val=f.srch_char_val and e.char_type_cd='CM_LEGCY'
inner join ci_sp d on d.sp_id=e.sp_id
inner join ci_sa_sp c on c.sp_id=d.sp_id
inner join ci_sa b on b.sa_id=c.sa_id and sa_type_cd='PPD' and sa_status_flg='20'
inner join ci_acct a on a.acct_id=b.acct_id
inner join ci_acct_char xy on a.acct_id=xy.acct_id and xy.char_type_cd='CM_MTDIS' AND xy.CHAR_VAL ='Y'
inner join ci_prem_char pc on pc.prem_id=a.mailing_prem_id and pc.char_type_cd = 'CM_NOCS'
inner join ci_char_val_l vl on vl.char_val=pc.char_val
where trunc(l.cre_dttm) = trunc(SYSDATE)
and l.activity_type_cd in ('REMOTEDISCONNECT','REMOTECONNECT')
and l.BUS_OBJ_CD in ('D1-RemoteConnect', 'D1-RemoteDisconnect')
and l.BO_STATUS_CD in ('COMPLETED', 'COMINPROG', 'DISCARDED')
```

#### **Query Breakdown:**

**Main Filter (Starting Point):**
- `d1_activity` - Activity/command table
- `trunc(l.cre_dttm) = trunc(SYSDATE)` - **Today's commands only**

**Joins Explained:**
1. `D1_ACTIVITY_REL_OBJ` - Links activity to device
2. `d1_dvc_cfg` - Device configuration
3. `d1_install_evt` - Installation events (active meters only)
4. `d1_sp_char` & `ci_sp_char` - Service point characteristics
5. `ci_sp`, `ci_sa_sp`, `ci_sa` - Service agreements (PPD = prepaid)
6. `ci_acct` - Customer accounts
7. `ci_acct_char` - Account filters (meter distribution enabled)
8. `ci_prem_char` & `ci_char_val_l` - **NOCS name** (location/area)

**Returned Columns:**
- `COMMAND_TYPE`: D1-RemoteConnect or D1-RemoteDisconnect
- `COMMAND_STATUS`: COMPLETED, COMINPROG, or DISCARDED
- `NOCS_NAME`: Area/location name (e.g., "Dhanmondi")

---

### **2. Reports Service**

**Location:** `backend/src/services/reports.service.js`

```javascript
const executeReport = async (reportName, bindParams = {}) => {
  try {
    // Read SQL file from reports directory
    const reportPath = path.join(reportsDir, `${reportName}.sql`);
    const sql = await fs.readFile(reportPath, 'utf8');

    // Remove trailing semicolon (Oracle doesn't like it)
    const cleanQuery = sql.trim().replace(/;+$/, '');

    // Execute query via Oracle connection pool
    const result = await executeQuery(cleanQuery, bindParams);

    return result; // Returns array of row objects
  } catch (error) {
    throw error;
  }
};
```

**What it does:**
1. Reads SQL file from disk
2. Cleans the query (removes semicolons)
3. Executes against Oracle database
4. Returns raw results as JSON array

---

### **3. Reports Controller**

**Location:** `backend/src/controllers/reports.controller.js`

```javascript
const getRCDCAnalyticsSummary = async (req, res) => {
  try {
    // Execute the report
    const data = await reportsService.executeReport('rc_dc_analytics_summary');

    // Return JSON response
    res.json({
      success: true,
      data,
      count: data.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Reports Controller] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch RC/DC analytics',
      error: error.message
    });
  }
};
```

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "COMMAND_TYPE": "D1-RemoteConnect",
      "COMMAND_STATUS": "COMPLETED",
      "NOCS_NAME": "Dhanmondi"
    },
    {
      "COMMAND_TYPE": "D1-RemoteDisconnect",
      "COMMAND_STATUS": "COMINPROG",
      "NOCS_NAME": "Gulshan"
    }
    // ... more rows
  ],
  "count": 1234,
  "timestamp": "2025-11-16T08:00:00.000Z"
}
```

---

### **4. Routes**

**Location:** `backend/src/routes/reports.routes.js`

```javascript
router.get('/rc_dc_analytics_summary', reportsController.getRCDCAnalyticsSummary);
```

**Full API Endpoint:**
```
GET http://localhost:3000/api/reports/rc_dc_analytics_summary
Authorization: Bearer <JWT_TOKEN>
```

---

## 🖥️ Frontend Implementation

### **1. API Service**

**Location:** `frontend/src/services/reports.api.js`

```javascript
export const reportsAPI = {
  getRCDCAnalyticsSummary() {
    return api.get('/reports/rc_dc_analytics_summary');
  }
};
```

**What it does:**
- Makes HTTP GET request to backend
- Automatically includes JWT token (via interceptor)
- Returns Promise with response data

---

### **2. Pinia Store (State Management)**

**Location:** `frontend/src/stores/reports.js`

#### **State Variables:**
```javascript
const analytics = ref({
  rcSuccess: 0,       // RC commands completed
  rcInProgress: 0,    // RC commands pending
  dcSuccess: 0,       // DC commands completed
  dcInProgress: 0,    // DC commands pending
  dcFailed: 0,        // DC commands failed
  totalCommands: 0,   // Total commands today
  lastUpdated: null   // Last refresh timestamp
});

const nocsData = ref([]); // NOCS-wise breakdown
const analyticsLoading = ref(false);
const analyticsError = ref(null);
```

#### **fetchAnalytics() Function:**

```javascript
const fetchAnalytics = async () => {
  analyticsLoading.value = true;

  try {
    // 1. Fetch data from API
    const response = await reportsAPI.getRCDCAnalyticsSummary();
    const data = response.data.data; // Array of commands

    // 2. Initialize counters
    const stats = {
      rcSuccess: 0,
      rcInProgress: 0,
      dcSuccess: 0,
      dcInProgress: 0,
      dcFailed: 0,
      totalCommands: data.length,
      lastUpdated: new Date()
    };

    const nocsMap = {}; // For NOCS-wise stats

    // 3. Process each command row
    data.forEach((row) => {
      const commandType = row.COMMAND_TYPE?.trim();
      const commandStatus = row.COMMAND_STATUS?.trim();
      const nocsName = row.NOCS_NAME?.trim() || 'Unknown';

      // Count overall statistics
      if (commandType === 'D1-RemoteConnect' && commandStatus === 'COMPLETED') {
        stats.rcSuccess++;
      } else if (commandType === 'D1-RemoteConnect' && commandStatus === 'COMINPROG') {
        stats.rcInProgress++;
      } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'COMPLETED') {
        stats.dcSuccess++;
      } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'COMINPROG') {
        stats.dcInProgress++;
      } else if (commandType === 'D1-RemoteDisconnect' && commandStatus === 'DISCARDED') {
        stats.dcFailed++;
      }

      // Count NOCS-wise statistics
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

      nocsMap[nocsName].total++;

      // Increment NOCS counters based on command type/status
      if (commandType === 'D1-RemoteConnect' && commandStatus === 'COMPLETED') {
        nocsMap[nocsName].rcSuccess++;
      }
      // ... similar logic for other combinations
    });

    // 4. Convert NOCS map to sorted array
    const nocsArray = Object.values(nocsMap).sort((a, b) => b.total - a.total);

    // 5. Update state
    analytics.value = stats;
    nocsData.value = nocsArray;

    return { success: true, message: 'Data loaded' };
  } catch (error) {
    analyticsError.value = error.message;
    return { success: false, message: 'Failed to load' };
  } finally {
    analyticsLoading.value = false;
  }
};
```

**Data Flow:**
```
Raw Data from API          Processing              Final State
─────────────────    ──────────────────────    ──────────────────
[                    Loop through each row     analytics.value = {
  {                  Count by type/status        rcSuccess: 45,
    COMMAND_TYPE,    Group by NOCS name          rcInProgress: 12,
    COMMAND_STATUS,                               dcSuccess: 78,
    NOCS_NAME                                     dcInProgress: 5,
  },                                              dcFailed: 3,
  ...                                             totalCommands: 143
]                                               }

                                                nocsData.value = [
                                                  {
                                                    nocsName: "Dhanmondi",
                                                    rcSuccess: 15,
                                                    rcInProgress: 3,
                                                    ...
                                                  },
                                                  ...
                                                ]
```

---

### **3. Dashboard View Component**

**Location:** `frontend/src/views/RCDCDashboardView.vue`

#### **Template Structure:**

```vue
<template>
  <!-- 1. Header Section (Gradient Background) -->
  <div class="header">
    <h1>DPDC RC/DC Dashboard</h1>
    <button @click="fetchData">Refresh</button>
  </div>

  <!-- 2. Error Alert (if connection fails) -->
  <app-alert v-if="reportsStore.analyticsError">
    Database connection error...
  </app-alert>

  <!-- 3. Loading Spinner -->
  <div v-if="reportsStore.analyticsLoading">
    <spinner /> Loading dashboard data...
  </div>

  <!-- 4. Main Content (when loaded) -->
  <div v-else>

    <!-- 4a. Overview Stats Cards (4 cards) -->
    <div class="grid-4-cols">
      <app-card>Total: {{ analytics.totalCommands }}</app-card>
      <app-card>RC Success: {{ rcSuccessRate }}%</app-card>
      <app-card>DC Success: {{ dcSuccessRate }}%</app-card>
      <app-card>Overall: {{ overallRate }}%</app-card>
    </div>

    <!-- 4b. Remote Connect Section (2 cards) -->
    <div class="rc-section">
      <app-card>Completed: {{ analytics.rcSuccess }}</app-card>
      <app-card>In Progress: {{ analytics.rcInProgress }}</app-card>
    </div>

    <!-- 4c. Remote Disconnect Section (3 cards) -->
    <div class="dc-section">
      <app-card>Completed: {{ analytics.dcSuccess }}</app-card>
      <app-card>In Progress: {{ analytics.dcInProgress }}</app-card>
      <app-card>Failed: {{ analytics.dcFailed }}</app-card>
    </div>

    <!-- 4d. NOCS-wise Table -->
    <app-table :data="nocsData" :columns="headers">
      <!-- Shows breakdown by location -->
    </app-table>

  </div>
</template>
```

#### **Script Logic:**

```javascript
import { useReportsStore } from '@/stores/reports';

const reportsStore = useReportsStore();

// Fetch data on component mount
onMounted(() => {
  if (reportsStore.nocsData.length === 0) {
    fetchData();
  }
});

// Refresh button handler
const fetchData = async () => {
  await reportsStore.fetchAnalytics();
};

// Calculate success rate percentage
const calculateSuccessRate = (success, total) => {
  if (total === 0) return '0.0';
  return ((success / total) * 100).toFixed(1);
};
```

#### **Styling:**
- Uses **Tailwind CSS** utility classes
- Material Design 3 inspired
- Fully responsive (mobile, tablet, desktop)
- Smooth animations and hover effects

---

## 🔄 Complete Data Flow (Step-by-Step)

### **When User Opens Dashboard:**

```
1. Browser
   └─> RCDCDashboardView.vue component loads
       └─> onMounted() hook triggers
           └─> Calls fetchData()

2. Frontend Store
   └─> reportsStore.fetchAnalytics() executes
       └─> Calls reportsAPI.getRCDCAnalyticsSummary()
           └─> Makes HTTP GET request

3. API Request
   └─> GET http://localhost:3000/api/reports/rc_dc_analytics_summary
       Headers: { Authorization: "Bearer <token>" }

4. Backend Routes
   └─> Router matches: /api/reports/rc_dc_analytics_summary
       └─> Calls: reportsController.getRCDCAnalyticsSummary()

5. Backend Controller
   └─> Calls: reportsService.executeReport('rc_dc_analytics_summary')

6. Reports Service
   └─> Reads: backend/reports/rc_dc_analytics_summary.sql
       └─> Executes SQL query against Oracle database

7. Oracle Database
   └─> Filters today's commands (trunc(cre_dttm) = trunc(SYSDATE))
       └─> Joins multiple tables
           └─> Returns array of rows:
               [
                 { COMMAND_TYPE: 'D1-RemoteConnect', COMMAND_STATUS: 'COMPLETED', NOCS_NAME: 'Dhanmondi' },
                 { COMMAND_TYPE: 'D1-RemoteDisconnect', COMMAND_STATUS: 'COMINPROG', NOCS_NAME: 'Gulshan' },
                 ...
               ]

8. Backend Response
   └─> Returns JSON:
       {
         success: true,
         data: [...],
         count: 1234,
         timestamp: "2025-11-16T08:00:00.000Z"
       }

9. Frontend Store (Processing)
   └─> Receives response.data.data
       └─> Loops through each row
           └─> Counts by command type & status
               └─> Groups by NOCS name
                   └─> Updates reactive state:
                       analytics.value = { rcSuccess: 45, rcInProgress: 12, ... }
                       nocsData.value = [{ nocsName: "Dhanmondi", ... }, ...]

10. Vue Reactivity
    └─> State changes trigger component re-render
        └─> Template updates automatically
            └─> User sees dashboard with statistics!
```

---

## 📊 Example Data Transformation

### **Input (from Oracle):**
```json
[
  { "COMMAND_TYPE": "D1-RemoteConnect", "COMMAND_STATUS": "COMPLETED", "NOCS_NAME": "Dhanmondi" },
  { "COMMAND_TYPE": "D1-RemoteConnect", "COMMAND_STATUS": "COMPLETED", "NOCS_NAME": "Dhanmondi" },
  { "COMMAND_TYPE": "D1-RemoteConnect", "COMMAND_STATUS": "COMINPROG", "NOCS_NAME": "Gulshan" },
  { "COMMAND_TYPE": "D1-RemoteDisconnect", "COMMAND_STATUS": "COMPLETED", "NOCS_NAME": "Dhanmondi" },
  { "COMMAND_TYPE": "D1-RemoteDisconnect", "COMMAND_STATUS": "DISCARDED", "NOCS_NAME": "Gulshan" }
]
```

### **Output (analytics state):**
```json
{
  "rcSuccess": 2,
  "rcInProgress": 1,
  "dcSuccess": 1,
  "dcInProgress": 0,
  "dcFailed": 1,
  "totalCommands": 5
}
```

### **Output (nocsData state):**
```json
[
  {
    "nocsName": "Dhanmondi",
    "rcSuccess": 2,
    "rcInProgress": 0,
    "dcSuccess": 1,
    "dcInProgress": 0,
    "dcFailed": 0,
    "total": 3
  },
  {
    "nocsName": "Gulshan",
    "rcSuccess": 0,
    "rcInProgress": 1,
    "dcSuccess": 0,
    "dcInProgress": 0,
    "dcFailed": 1,
    "total": 2
  }
]
```

---

## 🛠️ Key Technologies Used

### **Backend:**
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **oracledb** - Oracle database driver
- **JWT** - Authentication tokens
- **File System (fs)** - Read SQL files from disk

### **Frontend:**
- **Vue 3** - JavaScript framework (Composition API)
- **Pinia** - State management
- **Axios** - HTTP client
- **Vue Router** - Navigation
- **Tailwind CSS** - Styling
- **Heroicons** - SVG icons

---

## 🔐 Security Features

1. **JWT Authentication**: All API requests require valid token
2. **SQL Injection Prevention**: Uses parameterized queries
3. **Read-only Database User**: Oracle user has SELECT-only permissions
4. **CORS Protection**: Only allowed origins can access API
5. **Error Handling**: Sensitive data not exposed in error messages

---

## ⚡ Performance Optimizations

1. **Oracle Hint**: `/*+ FIRST_ROWS(1000) */` - Fast initial response
2. **Selective Columns**: Only fetch 3 columns needed for stats
3. **No Aggregation**: Removed GROUP BY/ORDER BY (done in JavaScript)
4. **Date Filter First**: `trunc(l.cre_dttm) = trunc(SYSDATE)` applied early
5. **Frontend Caching**: Data stored in Pinia store (no re-fetch on navigation)
6. **Async Operations**: Non-blocking API calls

---

## 📝 File Structure Summary

```
backend/
├── reports/
│   └── rc_dc_analytics_summary.sql    ← SQL query file
├── src/
│   ├── services/
│   │   └── reports.service.js         ← Executes SQL files
│   ├── controllers/
│   │   └── reports.controller.js      ← API handlers
│   └── routes/
│       ├── reports.routes.js          ← API endpoints
│       └── index.js                   ← Mount routes

frontend/
├── src/
│   ├── services/
│   │   └── reports.api.js             ← API client
│   ├── stores/
│   │   └── reports.js                 ← State management + logic
│   ├── views/
│   │   └── RCDCDashboardView.vue      ← Dashboard UI
│   ├── components/
│   │   ├── common/
│   │   │   ├── AppCard.vue            ← Reusable card
│   │   │   ├── AppTable.vue           ← Data table
│   │   │   └── AppAlert.vue           ← Error alert
│   │   └── layout/
│   │       └── Sidebar.vue            ← Navigation menu
│   └── router/
│       └── index.js                   ← Routes config
```

---

## 🎯 Summary

The RC/DC Dashboard is a **full-stack real-time monitoring system** that:

1. **Queries Oracle database** for today's meter commands
2. **Processes raw data** in JavaScript to calculate statistics
3. **Displays interactive dashboard** with charts and tables
4. **Updates automatically** when user clicks refresh
5. **Handles errors gracefully** with timeout protection and error messages

It follows a **clean architecture** pattern with separated concerns:
- **Data Layer** (Oracle SQL)
- **Service Layer** (Backend Node.js)
- **Presentation Layer** (Frontend Vue.js)

This makes the code **maintainable, testable, and scalable**! 🚀
