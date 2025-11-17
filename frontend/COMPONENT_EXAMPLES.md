# Component Usage Examples

This guide provides practical examples of how to use each component in the new UI system.

---

## 🎨 Layout Components

### AppLayout

The main layout wrapper that includes sidebar and top bar.

```vue
<template>
  <AppLayout>
    <!-- Your page content goes here -->
    <div class="space-y-6">
      <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
      <!-- Rest of your content -->
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/components/layout/AppLayout.vue';
</script>
```

**Note**: App.vue already wraps all pages (except login) in AppLayout, so you don't need to add it to individual pages.

---

## 🔄 AppStepper (Wizard Component)

Multi-step wizard interface for guided workflows.

### Basic Usage

```vue
<template>
  <AppStepper
    v-model="currentStep"
    :steps="steps"
    :can-proceed="canProceedToNext"
    @step-change="handleStepChange"
    @complete="handleComplete"
  >
    <!-- Step 1: Basic Info -->
    <template #step-1>
      <AppCard title="Basic Information">
        <div class="space-y-4">
          <AppInput
            v-model="formData.name"
            label="Name"
            placeholder="Enter your name"
            required
          />
          <AppInput
            v-model="formData.email"
            type="email"
            label="Email"
            placeholder="Enter your email"
            required
          />
        </div>
      </AppCard>
    </template>

    <!-- Step 2: Details -->
    <template #step-2>
      <AppCard title="Additional Details">
        <div class="space-y-4">
          <AppInput
            v-model="formData.phone"
            label="Phone"
            placeholder="Enter phone number"
          />
          <AppInput
            v-model="formData.address"
            type="textarea"
            label="Address"
            :rows="4"
          />
        </div>
      </AppCard>
    </template>

    <!-- Step 3: Review -->
    <template #step-3>
      <AppCard title="Review & Submit">
        <div class="space-y-3">
          <div class="flex justify-between py-2 border-b">
            <span class="font-medium">Name:</span>
            <span>{{ formData.name }}</span>
          </div>
          <div class="flex justify-between py-2 border-b">
            <span class="font-medium">Email:</span>
            <span>{{ formData.email }}</span>
          </div>
          <!-- More review items -->
        </div>
      </AppCard>
    </template>
  </AppStepper>
</template>

<script setup>
import { ref, computed } from 'vue';
import AppStepper from '@/components/common/AppStepper.vue';
import AppCard from '@/components/common/AppCard.vue';
import AppInput from '@/components/common/AppInput.vue';

const currentStep = ref(1);
const formData = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
});

const steps = [
  { id: 1, title: 'Basic Info', description: 'Enter your basic information' },
  { id: 2, title: 'Details', description: 'Provide additional details' },
  { id: 3, title: 'Review', description: 'Review and submit' },
];

const canProceedToNext = computed(() => {
  if (currentStep.value === 1) {
    return formData.value.name && formData.value.email;
  }
  return true;
});

const handleStepChange = (step) => {
  console.log('Step changed to:', step);
};

const handleComplete = () => {
  console.log('Wizard completed!', formData.value);
  // Submit your form here
};
</script>
```

---

## 📦 AppCard

Versatile card component for content containers.

### Basic Card

```vue
<AppCard title="Simple Card">
  <p>This is a simple card with a title.</p>
</AppCard>
```

### Card with Header and Footer

```vue
<AppCard>
  <template #header>
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Custom Header</h3>
      <AppButton size="sm" variant="ghost">Action</AppButton>
    </div>
  </template>

  <p>Card content goes here.</p>

  <template #footer>
    <div class="flex justify-end gap-2">
      <AppButton variant="secondary">Cancel</AppButton>
      <AppButton variant="primary">Save</AppButton>
    </div>
  </template>
</AppCard>
```

### Loading Card

```vue
<AppCard title="Loading Data" :loading="isLoading">
  <!-- Content shows only when loading is false -->
  <p>Your data here</p>
</AppCard>
```

### Hoverable Card

```vue
<AppCard hoverable @click="handleCardClick">
  <p>Click me!</p>
</AppCard>
```

---

## 🔘 AppButton

Flexible button component with multiple variants.

### Button Variants

```vue
<template>
  <div class="flex flex-wrap gap-3">
    <AppButton variant="primary">Primary</AppButton>
    <AppButton variant="secondary">Secondary</AppButton>
    <AppButton variant="success">Success</AppButton>
    <AppButton variant="danger">Danger</AppButton>
    <AppButton variant="warning">Warning</AppButton>
    <AppButton variant="ghost">Ghost</AppButton>
  </div>
</template>
```

### Button Sizes

```vue
<div class="flex items-center gap-3">
  <AppButton size="sm">Small</AppButton>
  <AppButton size="md">Medium</AppButton>
  <AppButton size="lg">Large</AppButton>
</div>
```

### Button with Icons

```vue
<script setup>
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline';
</script>

<template>
  <div class="flex gap-3">
    <!-- Icon on left -->
    <AppButton variant="primary" :icon="PlusIcon">
      Add New
    </AppButton>

    <!-- Icon on right -->
    <AppButton variant="danger" :icon-right="TrashIcon">
      Delete
    </AppButton>

    <!-- Icon only -->
    <AppButton variant="ghost" :icon="PlusIcon" icon-only />
  </div>
</template>
```

### Loading State

```vue
<AppButton :loading="isSubmitting" @click="handleSubmit">
  Submit
</AppButton>
```

### Full Width Button

```vue
<AppButton variant="primary" block>
  Full Width Button
</AppButton>
```

---

## 📝 AppInput

Form input component with validation support.

### Text Input

```vue
<AppInput
  v-model="username"
  label="Username"
  placeholder="Enter username"
  required
  hint="Choose a unique username"
/>
```

### Input with Error

```vue
<AppInput
  v-model="email"
  type="email"
  label="Email Address"
  :error="emailError"
  required
/>

<script setup>
import { ref, computed } from 'vue';

const email = ref('');
const emailError = computed(() => {
  if (!email.value) return 'Email is required';
  if (!email.value.includes('@')) return 'Invalid email format';
  return '';
});
</script>
```

### Textarea

```vue
<AppInput
  v-model="description"
  type="textarea"
  label="Description"
  :rows="6"
  placeholder="Enter description"
/>
```

### Input with Icons

```vue
<script setup>
import { MagnifyingGlassIcon, LockClosedIcon } from '@heroicons/vue/24/outline';
</script>

<template>
  <AppInput
    v-model="searchQuery"
    :prefix-icon="MagnifyingGlassIcon"
    placeholder="Search..."
  />

  <AppInput
    v-model="password"
    type="password"
    :prefix-icon="LockClosedIcon"
    label="Password"
  />
</template>
```

### Number Input

```vue
<AppInput
  v-model.number="age"
  type="number"
  label="Age"
  :min="0"
  :max="120"
  :step="1"
/>
```

---

## 📊 AppTable

Responsive table component with desktop and mobile views.

### Basic Table

```vue
<template>
  <AppTable
    :columns="columns"
    :data="users"
    :loading="isLoading"
    striped
  >
    <!-- Custom cell for status -->
    <template #cell-status="{ value }">
      <span :class="['badge', value === 'active' ? 'badge-success' : 'badge-error']">
        {{ value }}
      </span>
    </template>

    <!-- Actions column -->
    <template #actions="{ row }">
      <div class="flex gap-2">
        <AppButton size="sm" variant="ghost" @click="editUser(row)">
          Edit
        </AppButton>
        <AppButton size="sm" variant="danger" @click="deleteUser(row)">
          Delete
        </AppButton>
      </div>
    </template>
  </AppTable>
</template>

<script setup>
import { ref } from 'vue';
import AppTable from '@/components/common/AppTable.vue';
import AppButton from '@/components/common/AppButton.vue';

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
];

const users = ref([
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
]);

const isLoading = ref(false);

const editUser = (user) => {
  console.log('Edit user:', user);
};

const deleteUser = (user) => {
  console.log('Delete user:', user);
};
</script>
```

### Selectable Table

```vue
<AppTable
  :columns="columns"
  :data="items"
  selectable
  @select="handleSelect"
  @select-all="handleSelectAll"
/>

<script setup>
const handleSelect = (selectedItems) => {
  console.log('Selected:', selectedItems);
};

const handleSelectAll = (selectedItems) => {
  console.log('All selected:', selectedItems);
};
</script>
```

---

## 🪟 AppModal

Modal dialog component.

### Basic Modal

```vue
<template>
  <div>
    <AppButton @click="showModal = true">Open Modal</AppButton>

    <AppModal
      v-model:show="showModal"
      title="Confirm Action"
      size="md"
    >
      <p>Are you sure you want to perform this action?</p>

      <template #footer>
        <AppButton variant="secondary" @click="showModal = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" @click="handleConfirm">
          Confirm
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AppModal from '@/components/common/AppModal.vue';
import AppButton from '@/components/common/AppButton.vue';

const showModal = ref(false);

const handleConfirm = () => {
  console.log('Confirmed!');
  showModal.value = false;
};
</script>
```

### Form Modal

```vue
<AppModal
  v-model:show="showFormModal"
  title="Add New User"
  size="lg"
  :close-on-backdrop="false"
>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <AppInput
      v-model="formData.name"
      label="Name"
      required
    />
    <AppInput
      v-model="formData.email"
      type="email"
      label="Email"
      required
    />
  </form>

  <template #footer>
    <AppButton variant="secondary" @click="showFormModal = false">
      Cancel
    </AppButton>
    <AppButton variant="primary" :loading="isSubmitting" @click="handleSubmit">
      Save
    </AppButton>
  </template>
</AppModal>
```

---

## 🔔 AppAlert

Alert/notification component.

### Alert Variants

```vue
<template>
  <div class="space-y-4">
    <AppAlert variant="success" title="Success!" message="Operation completed successfully." />
    <AppAlert variant="info" title="Info" message="Here's some information." />
    <AppAlert variant="warning" title="Warning" message="Please be careful!" />
    <AppAlert variant="error" title="Error" message="Something went wrong." />
  </div>
</template>
```

### Dismissible Alert

```vue
<AppAlert
  variant="info"
  title="New Feature"
  message="Check out our new dashboard!"
  dismissible
  @dismiss="handleDismiss"
/>
```

### Auto Dismiss Alert

```vue
<AppAlert
  variant="success"
  message="Changes saved successfully!"
  :auto-dismiss="3000"
  dismissible
/>
```

### Alert with Custom Content

```vue
<AppAlert variant="warning" title="Update Required">
  <p>Your application needs to be updated.</p>
  <AppButton size="sm" variant="warning" class="mt-2">
    Update Now
  </AppButton>
</AppAlert>
```

---

## 🎨 Utility Classes Quick Reference

### Colors

```html
<!-- Backgrounds -->
<div class="bg-primary-500">Primary background</div>
<div class="bg-success">Success background</div>
<div class="bg-error">Error background</div>

<!-- Text -->
<p class="text-primary-700">Primary text</p>
<p class="text-success-dark">Success text</p>
```

### Spacing

```html
<!-- Padding -->
<div class="p-4">Padding all sides</div>
<div class="px-6 py-4">Padding x and y</div>

<!-- Margin -->
<div class="m-4">Margin all sides</div>
<div class="mb-6">Margin bottom</div>

<!-- Gap (for flex/grid) -->
<div class="flex gap-4">Items with gap</div>
```

### Layout

```html
<!-- Flex -->
<div class="flex items-center justify-between">
  Flex container
</div>

<!-- Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  Grid items
</div>
```

### Responsive Design

```html
<!-- Hidden on mobile, visible on desktop -->
<div class="hidden lg:block">Desktop only</div>

<!-- Full width on mobile, fixed width on desktop -->
<div class="w-full lg:w-1/2">Responsive width</div>
```

---

## 🚀 Complete Page Example

Here's a complete example of a page using multiple components:

```vue
<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
      <AppButton variant="primary" :icon="PlusIcon" @click="showAddModal = true">
        Add User
      </AppButton>
    </div>

    <!-- Success Alert -->
    <AppAlert
      v-if="successMessage"
      variant="success"
      :message="successMessage"
      dismissible
      :auto-dismiss="5000"
      @dismiss="successMessage = ''"
    />

    <!-- Users Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :data="users"
        :loading="isLoading"
        striped
      >
        <template #cell-role="{ value }">
          <span class="badge badge-primary capitalize">{{ value }}</span>
        </template>

        <template #actions="{ row }">
          <div class="flex gap-2">
            <AppButton size="sm" variant="ghost" :icon="PencilIcon" icon-only @click="editUser(row)" />
            <AppButton size="sm" variant="danger" :icon="TrashIcon" icon-only @click="deleteUser(row)" />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Add User Modal -->
    <AppModal v-model:show="showAddModal" title="Add New User" size="md">
      <div class="space-y-4">
        <AppInput
          v-model="newUser.name"
          label="Name"
          placeholder="Enter name"
          required
        />
        <AppInput
          v-model="newUser.email"
          type="email"
          label="Email"
          placeholder="Enter email"
          required
        />
      </div>

      <template #footer>
        <AppButton variant="secondary" @click="showAddModal = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" :loading="isSaving" @click="saveUser">
          Save
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline';
import AppCard from '@/components/common/AppCard.vue';
import AppTable from '@/components/common/AppTable.vue';
import AppButton from '@/components/common/AppButton.vue';
import AppModal from '@/components/common/AppModal.vue';
import AppInput from '@/components/common/AppInput.vue';
import AppAlert from '@/components/common/AppAlert.vue';

const showAddModal = ref(false);
const isLoading = ref(false);
const isSaving = ref(false);
const successMessage = ref('');

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
];

const users = ref([
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
]);

const newUser = ref({
  name: '',
  email: '',
});

const saveUser = async () => {
  isSaving.value = true;
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  users.value.push({ id: users.value.length + 1, ...newUser.value, role: 'user' });
  successMessage.value = 'User added successfully!';
  showAddModal.value = false;
  newUser.value = { name: '', email: '' };
  isSaving.value = false;
};

const editUser = (user) => {
  console.log('Edit:', user);
};

const deleteUser = (user) => {
  console.log('Delete:', user);
};
</script>
```

---

Happy coding with the new UI system! 🎉
