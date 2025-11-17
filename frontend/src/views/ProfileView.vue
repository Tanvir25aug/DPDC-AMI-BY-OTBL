<template>
  <div class="profile-view">
    <h1>My Profile</h1>

    <div class="profile-info card">
      <h2>Account Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <label>Username:</label>
          <span>{{ authStore.user?.username }}</span>
        </div>
        <div class="info-item">
          <label>Email:</label>
          <span>{{ authStore.user?.email }}</span>
        </div>
        <div class="info-item">
          <label>Role:</label>
          <span class="role-badge">{{ authStore.userRole }}</span>
        </div>
        <div class="info-item">
          <label>Account Status:</label>
          <span :class="['status-badge', authStore.user?.is_active ? 'active' : 'inactive']">
            {{ authStore.user?.is_active ? 'Active' : 'Inactive' }}
          </span>
        </div>
        <div class="info-item">
          <label>Last Login:</label>
          <span>{{ formatDate(authStore.user?.last_login) }}</span>
        </div>
        <div class="info-item">
          <label>Member Since:</label>
          <span>{{ formatDate(authStore.user?.created_at) }}</span>
        </div>
      </div>
    </div>

    <div class="change-password card">
      <h2>Change Password</h2>
      <form @submit.prevent="handleChangePassword">
        <div class="form-group">
          <label for="currentPassword" class="form-label">Current Password</label>
          <input
            id="currentPassword"
            v-model="passwordForm.currentPassword"
            type="password"
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label for="newPassword" class="form-label">New Password</label>
          <input
            id="newPassword"
            v-model="passwordForm.newPassword"
            type="password"
            class="form-input"
            required
          />
          <small>At least 8 characters with uppercase, lowercase, number, and special character</small>
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="form-label">Confirm New Password</label>
          <input
            id="confirmPassword"
            v-model="passwordForm.confirmPassword"
            type="password"
            class="form-input"
            required
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="success" class="success-message">
          {{ success }}
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Changing...' : 'Change Password' }}
        </button>
      </form>
    </div>

    <div class="permissions card">
      <h2>Your Permissions</h2>
      <div class="permissions-grid">
        <div
          v-for="(value, key) in authStore.userPermissions"
          :key="key"
          class="permission-item"
        >
          <span :class="['permission-badge', value ? 'granted' : 'denied']">
            {{ value ? '✓' : '✗' }}
          </span>
          <span class="permission-name">{{ formatPermission(key) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const loading = ref(false);
const error = ref(null);
const success = ref(null);

const handleChangePassword = async () => {
  error.value = null;
  success.value = null;

  // Validate passwords match
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    error.value = 'New passwords do not match';
    return;
  }

  // Validate password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(passwordForm.value.newPassword)) {
    error.value = 'Password does not meet requirements';
    return;
  }

  loading.value = true;

  const result = await authStore.changePassword({
    currentPassword: passwordForm.value.currentPassword,
    newPassword: passwordForm.value.newPassword
  });

  loading.value = false;

  if (result.success) {
    success.value = 'Password changed successfully';
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  } else {
    error.value = result.message;
  }
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
};

const formatPermission = (key) => {
  return key
    .replace(/can_/g, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};
</script>

<style scoped>
.profile-view {
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 20px;
  color: #2c3e50;
}

h2 {
  margin-bottom: 20px;
  color: #2c3e50;
  font-size: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item label {
  font-weight: 600;
  color: #7f8c8d;
  font-size: 14px;
}

.info-item span {
  color: #2c3e50;
  font-size: 16px;
}

.role-badge {
  padding: 4px 12px;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 14px;
  text-transform: capitalize;
  display: inline-block;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  text-transform: uppercase;
  display: inline-block;
}

.status-badge.active {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background-color: #f8d7da;
  color: #721c24;
}

.change-password {
  max-width: 500px;
}

.change-password small {
  color: #7f8c8d;
  font-size: 12px;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.permission-badge {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
}

.permission-badge.granted {
  background-color: #d4edda;
  color: #155724;
}

.permission-badge.denied {
  background-color: #f8d7da;
  color: #721c24;
}

.permission-name {
  color: #2c3e50;
  font-size: 14px;
}
</style>
