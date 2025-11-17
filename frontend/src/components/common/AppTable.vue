<template>
  <div class="app-table">
    <!-- Desktop table view -->
    <div class="hidden md:block overflow-x-auto">
      <table class="table" :class="{ 'table-striped': striped }">
        <thead>
          <tr>
            <!-- Selection column -->
            <th v-if="selectable" class="w-12">
              <input
                type="checkbox"
                class="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
              />
            </th>

            <!-- Data columns -->
            <th
              v-for="column in columns"
              :key="column.key"
              :class="column.headerClass"
            >
              <button
                v-if="column.sortable"
                @click="handleSort(column.key)"
                class="flex items-center gap-2 hover:text-primary-600 transition-colors"
              >
                {{ column.label }}
                <ChevronUpDownIcon class="w-4 h-4" />
              </button>
              <span v-else>{{ column.label }}</span>
            </th>

            <!-- Actions column -->
            <th v-if="$slots.actions" class="text-right">Actions</th>
          </tr>
        </thead>

        <tbody v-if="!loading && data.length > 0">
          <tr v-for="(row, index) in data" :key="getRowKey(row, index)">
            <!-- Selection checkbox -->
            <td v-if="selectable">
              <input
                type="checkbox"
                class="checkbox"
                :checked="isSelected(row)"
                @change="toggleSelect(row)"
              />
            </td>

            <!-- Data cells -->
            <td v-for="column in columns" :key="column.key" :class="column.cellClass">
              <slot :name="`cell-${column.key}`" :row="row" :value="getNestedValue(row, column.key)">
                {{ getNestedValue(row, column.key) }}
              </slot>
            </td>

            <!-- Actions cell -->
            <td v-if="$slots.actions" class="text-right">
              <slot name="actions" :row="row"></slot>
            </td>
          </tr>
        </tbody>

        <!-- Loading state -->
        <tbody v-if="loading">
          <tr v-for="i in 3" :key="i">
            <td :colspan="columnCount" class="py-8">
              <div class="flex items-center justify-center">
                <div class="spinner spinner-md"></div>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- Empty state -->
        <tbody v-if="!loading && data.length === 0">
          <tr>
            <td :colspan="columnCount" class="py-12 text-center text-gray-500">
              <slot name="empty">
                <p>No data available</p>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile card view -->
    <div class="md:hidden space-y-4">
      <!-- Loading state -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="card animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <!-- Data cards -->
      <div v-else-if="data.length > 0" class="space-y-4">
        <div
          v-for="(row, index) in data"
          :key="getRowKey(row, index)"
          class="card"
        >
          <!-- Selection checkbox -->
          <div v-if="selectable" class="mb-3">
            <input
              type="checkbox"
              class="checkbox"
              :checked="isSelected(row)"
              @change="toggleSelect(row)"
            />
          </div>

          <!-- Data fields -->
          <div class="space-y-2">
            <div v-for="column in columns" :key="column.key">
              <span class="text-sm font-medium text-gray-600">{{ column.label }}:</span>
              <span class="ml-2 text-sm text-gray-900">
                <slot :name="`cell-${column.key}`" :row="row" :value="getNestedValue(row, column.key)">
                  {{ getNestedValue(row, column.key) }}
                </slot>
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="$slots.actions" class="mt-3 pt-3 border-t border-gray-200">
            <slot name="actions" :row="row"></slot>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="card py-12 text-center text-gray-500">
        <slot name="empty">
          <p>No data available</p>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ChevronUpDownIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  columns: {
    type: Array,
    required: true,
    validator: (columns) => {
      return columns.every(col => col.key && col.label);
    },
  },
  data: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  striped: {
    type: Boolean,
    default: false,
  },
  selectable: {
    type: Boolean,
    default: false,
  },
  rowKey: {
    type: String,
    default: 'id',
  },
});

const emit = defineEmits(['sort', 'select', 'select-all']);

const selectedRows = ref([]);

// Total column count including selection and actions
const columnCount = computed(() => {
  let count = props.columns.length;
  if (props.selectable) count++;
  if (props.$slots?.actions) count++;
  return count;
});

// Check if all rows are selected
const allSelected = computed(() => {
  return props.data.length > 0 && selectedRows.value.length === props.data.length;
});

// Get nested property value
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
};

// Get row key
const getRowKey = (row, index) => {
  return row[props.rowKey] || index;
};

// Check if row is selected
const isSelected = (row) => {
  const key = getRowKey(row);
  return selectedRows.value.some(selectedRow => getRowKey(selectedRow) === key);
};

// Toggle row selection
const toggleSelect = (row) => {
  const key = getRowKey(row);
  const index = selectedRows.value.findIndex(selectedRow => getRowKey(selectedRow) === key);

  if (index > -1) {
    selectedRows.value.splice(index, 1);
  } else {
    selectedRows.value.push(row);
  }

  emit('select', selectedRows.value);
};

// Toggle select all
const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedRows.value = [];
  } else {
    selectedRows.value = [...props.data];
  }

  emit('select-all', selectedRows.value);
};

// Handle column sort
const handleSort = (columnKey) => {
  emit('sort', columnKey);
};
</script>
