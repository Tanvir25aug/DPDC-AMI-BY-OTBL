# Bill Stop Analysis - Search & Filter Features

## Overview
Added comprehensive search and filter functionality to the Bill Stop Analysis modal to help users quickly find and analyze specific CRP/CPC customers with billing issues.

## New Features Added

### 1. Search Functionality
- **Real-time Search**: Instantly filters data as you type
- **Multi-field Search**: Searches across:
  - CRP Account Number
  - CPC Customer Number
  - Meter Number
  - Customer Name
- **Applies to**: Both summary table (CRP level) and detailed table (CPC level)

### 2. Filter Options

#### Filter by CRP Account
- **Type**: Dropdown selection
- **Options**: Dynamically populated with all CRP accounts from the data
- **Purpose**: Quickly focus on a specific CRP and all its CPC customers

#### Sort Options
- **CRP Account (A-Z)**: Alphabetical sorting by CRP account number
- **Bill Stop Count (High to Low)**: Show CRPs with most bill stop issues first
- **Issue Percentage (High to Low)**: Show CRPs with highest percentage of bill stop issues
- **Total CPCs (High to Low)**: Show CRPs with most CPC connections first

#### Billing Status Filter (Details Only)
- **Type**: Dropdown selection
- **Options**:
  - All Statuses
  - Bill Stop Issue
  - Active Billing
- **Applies to**: Detailed table only (when details are available)

### 3. Filter Management

#### Clear Filters Button
- Resets all filters and search to default state
- Located in the filter bar for easy access

#### Active Filters Display
- Shows which filters are currently active
- Displays as colored badges below the filter controls
- Shows:
  - Active search query
  - Selected CRP filter
  - Selected status filter

#### Auto-Reset on Close
- All filters automatically reset when closing the modal
- Ensures fresh start each time the modal is opened

### 4. Visual Feedback

#### Result Counts
- **Summary Table**: Shows "Showing X of Y CRPs"
- **Details Table**: Shows "Showing X of Y CPC customers"
- **Export Button**: Shows count of records to be exported
- **Modal Footer**: Dynamic count based on active filters

#### Empty State
- Custom "No results found" message when filters don't match any records
- Includes search icon for visual clarity

### 5. Export Enhancement
- **Filtered Export**: Export button now exports only the filtered/visible data
- **Filename Indicator**: Adds "_Filtered" suffix to filename when filters are active
- **Count Display**: Shows exact number of records being exported on the button

## Usage Instructions

### To Search:
1. Open Bill Stop Analysis modal
2. Type in the search box (searches CRP, Customer, Meter, or Name)
3. Results update instantly

### To Filter by CRP:
1. Click the "Filter by CRP" dropdown
2. Select a specific CRP account
3. View all CPC customers under that CRP

### To Sort Data:
1. Click the "Sort By" dropdown
2. Select your preferred sorting option:
   - Default: Alphabetical by CRP
   - By bill stop count (highest first)
   - By issue percentage (highest first)
   - By total CPCs (largest first)

### To Filter by Status (Details):
1. When detailed data is available
2. Click the "Billing Status" dropdown
3. Select "Bill Stop Issue" or "Active Billing"

### To Clear All Filters:
1. Click the "Clear" button in the filter bar
2. All filters and search will reset

### To Export Filtered Data:
1. Apply your desired filters
2. Click the "Export" button
3. Only filtered/visible records will be exported
4. Filename will include "_Filtered" suffix if filters are active

## Technical Details

### New State Variables
```javascript
const billStopSearchQuery = ref('');      // Search query
const billStopFilterCRP = ref('');        // Selected CRP filter
const billStopFilterStatus = ref('');     // Selected status filter
const billStopSortBy = ref('crp');        // Sort option
```

### Computed Properties
- `filteredBillStopSummary`: Filtered and sorted summary data
- `filteredBillStopDetails`: Filtered detailed CPC data
- `uniqueCRPAccounts`: List of unique CRP accounts for dropdown

### Filter Logic
1. **Search Filter**: Case-insensitive substring matching
2. **CRP Filter**: Exact match on CRP account number
3. **Status Filter**: Exact match on billing status
4. **Sort**: Multiple sort options with numeric/string comparison

## Benefits

1. **Faster Analysis**: Quickly find specific customers or issues
2. **Focused Exports**: Export only relevant data
3. **Better Insights**: Sort by different metrics to identify priorities
4. **User-Friendly**: Clear visual feedback and easy-to-use controls
5. **Performance**: Client-side filtering for instant results

## Files Modified
- `frontend/src/views/CRPCPCView.vue`: All search and filter functionality

## Backward Compatibility
- Fully backward compatible
- Existing functionality unchanged
- Filters are optional and default to showing all data
- Auto-reset ensures no persistent state issues
