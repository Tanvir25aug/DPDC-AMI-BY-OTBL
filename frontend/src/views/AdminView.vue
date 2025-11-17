<template>
  <div class="admin-view">
    <h1>User Management</h1>

    <div class="actions-bar card">
      <button @click="showCreateModal = true" class="btn btn-primary">
        Create New User
      </button>

      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search users..."
          class="form-input"
          @input="debouncedSearch"
        />
      </div>
    </div>

    <div class="users-section card">
      <div v-if="userStore.loading" class="loading">Loading users...</div>

      <div v-else-if="users.length === 0" class="no-data">
        No users found
      </div>

      <div v-else>
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge">{{ user.role?.name || 'N/A' }}</span>
              </td>
              <td>
                <span :class="['status-badge', user.is_active ? 'active' : 'inactive']">
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>
                <button @click="editUser(user)" class="btn-icon" title="Edit">
                  ✏️
                </button>
                <button @click="deleteUser(user)" class="btn-icon" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination">
          <button
            @click="changePage(pagination.page - 1)"
            :disabled="pagination.page === 1"
            class="btn btn-secondary"
          >
            Previous
          </button>
          <span class="pagination-info">
            Page {{ pagination.page }} of {{ pagination.totalPages }}
          </span>
          <button
            @click="changePage(pagination.page + 1)"
            :disabled="pagination.page >= pagination.totalPages"
            class="btn btn-secondary"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit User Modal -->
    <div v-if="showCreateModal || editingUser" class="modal">
      <div class="modal-content">
        <h2>{{ editingUser ? 'Edit User' : 'Create New User' }}</h2>

        <form @submit.prevent="saveUser">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input
              v-model="userForm.username"
              type="text"
              class="form-input"
              required
              :disabled="editingUser"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input
              v-model="userForm.email"
              type="email"
              class="form-input"
              required
            />
          </div>

          <div v-if="!editingUser" class="form-group">
            <label class="form-label">Password</label>
            <input
              v-model="userForm.password"
              type="password"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">Role</label>
            <select v-model.number="userForm.role_id" class="form-input" required>
              <option value="">Select role</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }} - {{ role.description }}
              </option>
            </select>
          </div>

          <div v-if="editingUser" class="form-group">
            <label>
              <input type="checkbox" v-model="userForm.is_active" />
              Active
            </label>
          </div>

          <div v-if="formError" class="error-message">
            {{ formError }}
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
            <button type="button" @click="closeModal" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

const showCreateModal = ref(false);
const editingUser = ref(null);
const searchQuery = ref('');
const formError = ref(null);
const saving = ref(false);

const userForm = ref({
  username: '',
  email: '',
  password: '',
  role_id: '',
  is_active: true
});

const users = computed(() => userStore.users);
const roles = computed(() => userStore.roles);
const pagination = computed(() => userStore.pagination);

let searchTimeout = null;

onMounted(async () => {
  await userStore.fetchUsers();
  await userStore.fetchRoles();
});

const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    userStore.fetchUsers({ search: searchQuery.value });
  }, 500);
};

const changePage = (page) => {
  userStore.fetchUsers({ page, search: searchQuery.value });
};

const editUser = (user) => {
  editingUser.value = user;
  userForm.value = {
    username: user.username,
    email: user.email,
    role_id: user.role_id,
    is_active: user.is_active
  };
  formError.value = null;
};

const deleteUser = async (user) => {
  if (!confirm(`Are you sure you want to deactivate user "${user.username}"?`)) {
    return;
  }

  const result = await userStore.deleteUser(user.id);
  if (!result.success) {
    alert(result.message);
  }
};

const saveUser = async () => {
  saving.value = true;
  formError.value = null;

  let result;
  if (editingUser.value) {
    result = await userStore.updateUser(editingUser.value.id, {
      email: userForm.value.email,
      role_id: userForm.value.role_id,
      is_active: userForm.value.is_active
    });
  } else {
    result = await userStore.createUser(userForm.value);
  }

  saving.value = false;

  if (result.success) {
    closeModal();
  } else {
    formError.value = result.message;
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingUser.value = null;
  userForm.value = {
    username: '',
    email: '',
    password: '',
    role_id: '',
    is_active: true
  };
  formError.value = null;
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};
</script>

<style scoped>
.admin-view {
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-box {
  flex: 1;
  max-width: 300px;
}

.role-badge {
  padding: 4px 8px;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 12px;
  text-transform: capitalize;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: uppercase;
}

.status-badge.active {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background-color: #f8d7da;
  color: #721c24;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 5px;
  margin: 0 3px;
}

.btn-icon:hover {
  opacity: 0.7;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.pagination-info {
  color: #7f8c8d;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}
</style>
