# Frontend Updates for NOCS Balance Summary

## Changes Needed in: `frontend/src/views/NocsBalanceSummaryView.vue`

### 1. Update Computed Properties (Line ~220-250)

**FIND:**
```javascript
const totalPositiveQty = computed(() => {
  return data.value.reduce((sum, row) => sum + (parseInt(row.POSITIVE_QTY) || 0), 0);
});

const totalPositiveBalance = computed(() => {
  return data.value.reduce((sum, row) => sum + (parseFloat(row.POSITIVE_BALANCE_AMT) || 0), 0);
});

const totalNegativeQty = computed(() => {
  return data.value.reduce((sum, row) => sum + (parseInt(row.NEGATIVE_QTY) || 0), 0);
});

const totalNegativeBalance = computed(() => {
  return data.value.reduce((sum, row) => sum + (parseFloat(row.NEGATIVE_BALANCE_AMT) || 0), 0);
});
```

**REPLACE WITH:**
```javascript
const totalCreditQty = computed(() => {
  return data.value.reduce((sum, row) => sum + (parseInt(row.CREDIT_QTY) || 0), 0);
});

const totalCreditBalance = computed(() => {
  return data.value.reduce((sum, row) => sum + (parseFloat(row.CREDIT_BALANCE_AMT) || 0), 0);
});

const totalDueQty = computed(() => {
  return data.value.reduce((sum, row) => sum + (parseInt(row.DUE_QTY) || 0), 0);
});

const totalDueBalance = computed(() => {
  return data.value.reduce((sum, row) => sum + (parseFloat(row.DUE_BALANCE_AMT) || 0), 0);
});
```

---

### 2. Update Summary Cards (Line ~71-80)

**FIND:**
```vue
<div class="bg-white rounded-lg p-6 shadow-sm border-l-4 border-green-500">
  <div class="text-sm text-gray-600 mb-1 font-medium">Positive Balance</div>
  <div class="text-3xl font-bold text-green-600">৳{{ formatNumber(totalPositiveBalance) }}</div>
  <div class="text-xs text-gray-500 mt-1">{{ formatNumber(totalPositiveQty) }} customers</div>
</div>
<div class="bg-white rounded-lg p-6 shadow-sm border-l-4 border-red-500">
  <div class="text-sm text-gray-600 mb-1 font-medium">Negative Balance</div>
  <div class="text-3xl font-bold text-red-600">৳{{ formatNumber(Math.abs(totalNegativeBalance)) }}</div>
  <div class="text-xs text-gray-500 mt-1">{{ formatNumber(totalNegativeQty) }} customers</div>
</div>
```

**REPLACE WITH:**
```vue
<div class="bg-white rounded-lg p-6 shadow-sm border-l-4 border-green-500">
  <div class="text-sm text-gray-600 mb-1 font-medium">Credit Balance</div>
  <div class="text-3xl font-bold text-green-600">৳{{ formatNumber(totalCreditBalance) }}</div>
  <div class="text-xs text-gray-500 mt-1">{{ formatNumber(totalCreditQty) }} customers</div>
</div>
<div class="bg-white rounded-lg p-6 shadow-sm border-l-4 border-red-500">
  <div class="text-sm text-gray-600 mb-1 font-medium">Due Balance</div>
  <div class="text-3xl font-bold text-red-600">৳{{ formatNumber(totalDueBalance) }}</div>
  <div class="text-xs text-gray-500 mt-1">{{ formatNumber(totalDueQty) }} customers</div>
</div>
```

---

### 3. Update Net Balance Card (Line ~88-91)

**FIND:**
```vue
<div class="text-indigo-200 text-sm mt-2">
  {{ netBalance >= 0 ? 'Credit Balance' : 'Due Balance' }}
</div>
```

**REPLACE WITH:**
```vue
<div class="text-indigo-200 text-sm mt-2">
  {{ netBalance >= 0 ? 'Overall Due' : 'Overall Credit' }}
</div>
```

---

### 4. Update Table Headers (Line ~120-140)

**FIND:**
```vue
<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Positive Qty</th>
<th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Positive Balance</th>
<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Negative Qty</th>
<th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Negative Balance</th>
```

**REPLACE WITH:**
```vue
<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Credit Qty</th>
<th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Credit Balance</th>
<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Due Qty</th>
<th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Due Balance</th>
```

---

### 5. Update Table Body (Line ~160-180)

**FIND:**
```vue
<td class="px-4 py-3 text-sm">{{ formatNumber(row.POSITIVE_QTY) }}</td>
<td class="px-4 py-3 text-sm text-right text-green-600 font-medium">
  ৳{{ formatNumber(row.POSITIVE_BALANCE_AMT) }}
</td>
<td class="px-4 py-3 text-sm">{{ formatNumber(row.NEGATIVE_QTY) }}</td>
<td class="px-4 py-3 text-sm text-right text-red-600 font-medium">
  ৳{{ formatNumber(Math.abs(row.NEGATIVE_BALANCE_AMT)) }}
</td>
```

**REPLACE WITH:**
```vue
<td class="px-4 py-3 text-sm">{{ formatNumber(row.CREDIT_QTY) }}</td>
<td class="px-4 py-3 text-sm text-right text-green-600 font-medium">
  ৳{{ formatNumber(row.CREDIT_BALANCE_AMT) }}
</td>
<td class="px-4 py-3 text-sm">{{ formatNumber(row.DUE_QTY) }}</td>
<td class="px-4 py-3 text-sm text-right text-red-600 font-medium">
  -৳{{ formatNumber(row.DUE_BALANCE_AMT) }}
</td>
```

**NOTE:** Added `-` sign before DUE amounts!

---

### 6. Update Mobile View Cards (Line ~200-220)

**FIND:**
```vue
<div class="text-xs text-gray-500">Positive:</div>
<div class="text-sm font-semibold text-green-600">৳{{ formatNumber(row.POSITIVE_BALANCE_AMT) }}</div>
<div class="text-xs text-gray-500 mt-1">{{ formatNumber(row.POSITIVE_QTY) }} customers</div>

<div class="text-xs text-gray-500 mt-2">Negative:</div>
<div class="text-sm font-semibold text-red-600">৳{{ formatNumber(Math.abs(row.NEGATIVE_BALANCE_AMT)) }}</div>
<div class="text-xs text-gray-500">{{ formatNumber(row.NEGATIVE_QTY) }} customers</div>
```

**REPLACE WITH:**
```vue
<div class="text-xs text-gray-500">Credit:</div>
<div class="text-sm font-semibold text-green-600">৳{{ formatNumber(row.CREDIT_BALANCE_AMT) }}</div>
<div class="text-xs text-gray-500 mt-1">{{ formatNumber(row.CREDIT_QTY) }} customers</div>

<div class="text-xs text-gray-500 mt-2">Due:</div>
<div class="text-sm font-semibold text-red-600">-৳{{ formatNumber(row.DUE_BALANCE_AMT) }}</div>
<div class="text-xs text-gray-500">{{ formatNumber(row.DUE_QTY) }} customers</div>
```

---

### 7. Update Footer Totals (Line ~185-195)

**FIND:**
```vue
<td class="px-4 py-3 text-sm font-bold">{{ formatNumber(totalPositiveQty) }}</td>
<td class="px-4 py-3 text-sm text-right font-bold text-green-600">
  ৳{{ formatNumber(totalPositiveBalance) }}
</td>
<td class="px-4 py-3 text-sm font-bold">{{ formatNumber(totalNegativeQty) }}</td>
<td class="px-4 py-3 text-sm text-right font-bold text-red-600">
  ৳{{ formatNumber(Math.abs(totalNegativeBalance)) }}
</td>
```

**REPLACE WITH:**
```vue
<td class="px-4 py-3 text-sm font-bold">{{ formatNumber(totalCreditQty) }}</td>
<td class="px-4 py-3 text-sm text-right font-bold text-green-600">
  ৳{{ formatNumber(totalCreditBalance) }}
</td>
<td class="px-4 py-3 text-sm font-bold">{{ formatNumber(totalDueQty) }}</td>
<td class="px-4 py-3 text-sm text-right font-bold text-red-600">
  -৳{{ formatNumber(totalDueBalance) }}
</td>
```

---

### 8. Update Excel Export (Line ~280-295)

**FIND:**
```javascript
const exportData = data.value.map(row => ({
  'NOCS Name': row.NOCS_NAME,
  'NOCS Code': row.NOCS_CODE,
  'Total Customers': row.TOTAL_CUSTOMERS,
  'Positive Qty': row.POSITIVE_QTY,
  'Positive Balance': row.POSITIVE_BALANCE_AMT,
  'Negative Qty': row.NEGATIVE_QTY,
  'Negative Balance': Math.abs(row.NEGATIVE_BALANCE_AMT),
  'Net Balance': row.NET_BALANCE
}));

// Add totals row
exportData.push({
  'NOCS Name': 'TOTAL',
  'NOCS Code': '',
  'Total Customers': totalCustomers.value,
  'Positive Qty': totalPositiveQty.value,
  'Positive Balance': totalPositiveBalance.value,
  'Negative Qty': totalNegativeQty.value,
  'Negative Balance': Math.abs(totalNegativeBalance.value),
  'Net Balance': netBalance.value
});
```

**REPLACE WITH:**
```javascript
const exportData = data.value.map(row => ({
  'NOCS Name': row.NOCS_NAME,
  'NOCS Code': row.NOCS_CODE,
  'Total Customers': row.TOTAL_CUSTOMERS,
  'Credit Qty': row.CREDIT_QTY,
  'Credit Balance': row.CREDIT_BALANCE_AMT,
  'Due Qty': row.DUE_QTY,
  'Due Balance': `-${row.DUE_BALANCE_AMT}`,
  'Net Balance': row.NET_BALANCE
}));

// Add totals row
exportData.push({
  'NOCS Name': 'TOTAL',
  'NOCS Code': '',
  'Total Customers': totalCustomers.value,
  'Credit Qty': totalCreditQty.value,
  'Credit Balance': totalCreditBalance.value,
  'Due Qty': totalDueQty.value,
  'Due Balance': `-${totalDueBalance.value}`,
  'Net Balance': netBalance.value
});
```

---

## Summary of Changes

| Old Name | New Name | Display |
|----------|----------|---------|
| POSITIVE_QTY | CREDIT_QTY | Credit Qty |
| POSITIVE_BALANCE_AMT | CREDIT_BALANCE_AMT | ৳XXX (green) |
| NEGATIVE_QTY | DUE_QTY | Due Qty |
| NEGATIVE_BALANCE_AMT | DUE_BALANCE_AMT | **-৳XXX** (red, with minus sign) |

---

## Apply These Changes

Due to the large size of the Vue file, I recommend:

1. **Option A:** Make all these changes manually using Find & Replace in your editor
2. **Option B:** Let me create a completely new Vue file with all changes applied

Which option do you prefer?
