<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-brand">
        <router-link to="/dashboard" class="brand-link">
          <img src="@/assets/DPDC_Logo.png" alt="DPDC Logo" class="brand-logo dpdc-logo" />
          <span class="brand-text">DPDC AMI by</span>
          <img src="@/assets/OTBL_logo.png" alt="OTBL Logo" class="brand-logo otbl-logo" />
        </router-link>
      </div>

      <div class="navbar-menu">
        <router-link to="/dashboard" class="nav-link">
          Dashboard
        </router-link>
        <router-link to="/reports" class="nav-link">
          Reports
        </router-link>
        <router-link to="/nocs-due-summary" class="nav-link">
          NOCS Due
        </router-link>
        <router-link to="/query-history" class="nav-link">
          History
        </router-link>
        <router-link v-if="authStore.hasPermission('can_manage_users')" to="/admin" class="nav-link">
          Admin
        </router-link>
      </div>

      <div class="navbar-user">
        <div class="user-info">
          <span class="username">{{ authStore.user?.username }}</span>
          <span class="user-role">{{ authStore.userRole }}</span>
        </div>
        <div class="user-menu">
          <router-link to="/profile" class="user-menu-item">
            Profile
          </router-link>
          <button @click="handleLogout" class="user-menu-item logout-btn">
            Logout
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.navbar {
  background-color: #2c3e50;
  color: white;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 90px;
}

.navbar-brand .brand-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  transition: opacity 0.3s;
}

.navbar-brand .brand-link:hover {
  opacity: 0.9;
}

.brand-logo {
  height: 60px;
  width: auto;
  object-fit: contain;
}

.dpdc-logo {
  filter: brightness(1.1);
}

.otbl-logo {
  height: 45px;
}

.brand-text {
  color: white;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.navbar-menu {
  display: flex;
  gap: 20px;
  flex: 1;
  padding-left: 40px;
}

.nav-link {
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background-color: rgba(255,255,255,0.1);
  color: white;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.username {
  font-weight: 500;
}

.user-role {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  text-transform: capitalize;
}

.user-menu {
  display: flex;
  gap: 10px;
}

.user-menu-item {
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
  background: none;
  border: none;
  cursor: pointer;
}

.user-menu-item:hover {
  background-color: rgba(255,255,255,0.1);
  color: white;
}

.logout-btn {
  color: #ff6b6b;
}

.logout-btn:hover {
  background-color: rgba(255,107,107,0.1);
}
</style>
