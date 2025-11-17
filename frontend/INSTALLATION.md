# Installation Guide - Modern UI/UX Upgrade

## 📦 Step 1: Install Required Dependencies

Run the following command in the `frontend` directory:

```bash
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest @tailwindcss/forms
npm install @heroicons/vue
```

### What gets installed:
- **tailwindcss**: Utility-first CSS framework
- **postcss**: CSS transformations
- **autoprefixer**: Automatically adds vendor prefixes
- **@tailwindcss/forms**: Better form styling
- **@heroicons/vue**: Modern icon set from Tailwind team

---

## 🎨 Step 2: Configuration Files

The following files have been created for you:

1. **tailwind.config.js** - Tailwind configuration with custom theme
2. **postcss.config.js** - PostCSS configuration
3. **DESIGN_GUIDELINES.md** - Complete design system documentation

---

## 📝 Step 3: Update Main CSS File

Create or update `src/assets/main.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-gray-50 text-gray-900 font-sans antialiased;
  }
}

@layer components {
  /* Custom component styles */
  .btn {
    @apply px-6 py-2.5 rounded-button font-medium transition-all duration-200;
    @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  }

  .btn-primary {
    @apply bg-primary-500 text-white hover:bg-primary-600;
    @apply focus:ring-primary-500;
  }

  .btn-secondary {
    @apply bg-transparent border-2 border-primary-500 text-primary-500;
    @apply hover:bg-primary-50 focus:ring-primary-500;
  }

  .btn-success {
    @apply bg-success text-white hover:bg-success-dark;
    @apply focus:ring-success;
  }

  .btn-danger {
    @apply bg-error text-white hover:bg-error-dark;
    @apply focus:ring-error;
  }

  .card {
    @apply bg-white rounded-card shadow-card p-6;
  }

  .card-hover {
    @apply hover:shadow-card-hover transition-shadow duration-200;
  }

  .input {
    @apply w-full px-4 py-3 border border-gray-300 rounded-button;
    @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
    @apply transition-all duration-200;
  }

  .label {
    @apply block text-sm font-medium text-gray-700 mb-2;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

---

## 🔧 Step 4: Update main.js

Update `src/main.js` to import Tailwind CSS:

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// Import Tailwind CSS
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')
```

---

## ✅ Step 5: Verify Installation

Run the development server:

```bash
npm run dev
```

You should see Tailwind CSS working. Check by:
1. Opening browser console
2. Inspecting elements
3. Verifying Tailwind classes are applied

---

## 🎯 Next Steps

After installation, you can:

1. **Use the new components** (see below)
2. **Update existing views** to use new design system
3. **Test responsive behavior** on different screen sizes

---

## 🚀 Quick Start with New Components

### Using the Sidebar Layout

```vue
<template>
  <AppLayout>
    <template #sidebar>
      <Sidebar />
    </template>

    <template #default>
      <div class="p-6">
        <!-- Your page content -->
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
</script>
```

### Using the Wizard/Stepper

```vue
<template>
  <AppStepper
    :steps="steps"
    :current-step="currentStep"
    @step-change="handleStepChange"
  >
    <template #step-1>
      <!-- Step 1 content -->
    </template>

    <template #step-2>
      <!-- Step 2 content -->
    </template>

    <template #step-3>
      <!-- Step 3 content -->
    </template>
  </AppStepper>
</template>

<script setup>
import { ref } from 'vue'
import AppStepper from '@/components/common/AppStepper.vue'

const currentStep = ref(1)
const steps = [
  { id: 1, title: 'Basic Info', description: 'Enter basic information' },
  { id: 2, title: 'Details', description: 'Provide additional details' },
  { id: 3, title: 'Review', description: 'Review and submit' }
]

const handleStepChange = (step) => {
  currentStep.value = step
}
</script>
```

---

## 📱 Testing Responsiveness

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Test on:
1. Chrome DevTools (mobile simulation)
2. Real mobile devices
3. Different screen orientations

---

## 🐛 Troubleshooting

### Tailwind classes not working
1. Check if `tailwind.config.js` is in the right location
2. Verify `main.css` is imported in `main.js`
3. Restart the dev server (`npm run dev`)

### Icons not showing
1. Verify `@heroicons/vue` is installed
2. Import correctly: `import { HomeIcon } from '@heroicons/vue/24/outline'`

### Build errors
1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Clear Vite cache: `rm -rf node_modules/.vite`

---

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Heroicons](https://heroicons.com/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Material Design Guidelines](https://m3.material.io/)

---

*Happy coding! 🎉*
