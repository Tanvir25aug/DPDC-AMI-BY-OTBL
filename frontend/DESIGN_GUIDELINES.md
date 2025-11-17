# Modern UI/UX Design Guidelines - DPDC AMI by OTBL

## 🎨 Design Philosophy

This application follows **Material Design 3** principles with a modern, clean, and professional aesthetic. The design emphasizes clarity, efficiency, and accessibility.

---

## 🎯 Core Design Principles

### 1. **Material Design 3 Inspired**
- Elevated surfaces with subtle shadows
- Smooth transitions and animations
- Clear visual hierarchy
- Consistent spacing and alignment

### 2. **Wizard-Style Multi-Step Interface**
- Step-by-step guided workflows
- Progress indicators
- Clear navigation between steps
- Validation at each step

### 3. **Mobile-First Responsive Design**
- Fully responsive across all devices
- Collapsible sidebar on mobile
- Touch-friendly interface elements
- Adaptive grid layouts

---

## 🎨 Color Palette

### Primary Colors
```css
--primary-50: #E3F2FD;
--primary-100: #BBDEFB;
--primary-200: #90CAF9;
--primary-300: #64B5F6;
--primary-400: #42A5F5;
--primary-500: #2196F3;  /* Main Primary */
--primary-600: #1E88E5;
--primary-700: #1976D2;
--primary-800: #1565C0;
--primary-900: #0D47A1;
```

### Secondary Colors
```css
--secondary-50: #F3E5F5;
--secondary-100: #E1BEE7;
--secondary-200: #CE93D8;
--secondary-300: #BA68C8;
--secondary-400: #AB47BC;
--secondary-500: #9C27B0;  /* Main Secondary */
--secondary-600: #8E24AA;
--secondary-700: #7B1FA2;
--secondary-800: #6A1B9A;
--secondary-900: #4A148C;
```

### Neutral Colors
```css
--gray-50: #FAFAFA;
--gray-100: #F5F5F5;
--gray-200: #EEEEEE;
--gray-300: #E0E0E0;
--gray-400: #BDBDBD;
--gray-500: #9E9E9E;
--gray-600: #757575;
--gray-700: #616161;
--gray-800: #424242;
--gray-900: #212121;
```

### Semantic Colors
```css
--success: #4CAF50;
--warning: #FF9800;
--error: #F44336;
--info: #2196F3;
```

---

## 📐 Layout Structure

### Grid System
- **Desktop**: 12-column grid with 24px gutters
- **Tablet**: 8-column grid with 16px gutters
- **Mobile**: 4-column grid with 16px gutters

### Breakpoints
```css
sm: 640px   /* Small devices */
md: 768px   /* Medium devices (tablets) */
lg: 1024px  /* Large devices (desktops) */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* Ultra-wide screens */
```

### Spacing Scale
```css
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

---

## 🧭 Navigation Structure

### Sidebar Navigation
- **Width**: 280px (expanded), 64px (collapsed)
- **Background**: White with subtle shadow
- **Active State**: Primary color background with white text
- **Icons**: 24x24px from Heroicons
- **Labels**: Shown only when expanded

### Navigation Items
1. **Dashboard** - Overview and statistics
2. **Reports** - Query builder and execution
3. **History** - Query execution history
4. **Admin** - User management (admin only)
5. **Profile** - User settings

### Mobile Navigation
- Hamburger menu icon (top-left)
- Slide-in drawer from left
- Overlay backdrop when open
- Swipe-to-close gesture support

---

## 🔄 Wizard/Stepper Component

### Structure
```
┌─────────────────────────────────┐
│  Step 1   →  Step 2  →  Step 3  │
│  Active      Todo       Todo     │
├─────────────────────────────────┤
│                                  │
│         Step Content Here        │
│                                  │
├─────────────────────────────────┤
│  [Back]         [Next/Submit]    │
└─────────────────────────────────┘
```

### States
- **Todo**: Gray color, disabled
- **Active**: Primary color, emphasized
- **Completed**: Green checkmark
- **Error**: Red color with error icon

### Features
- Linear progression (can't skip steps)
- Optional validation before proceeding
- Persistent state across navigation
- Clear visual feedback

---

## 🎯 Component Design Patterns

### Cards
```
┌─────────────────────────┐
│  Card Title      [Icon] │
│  ─────────────────────  │
│                         │
│  Content Area           │
│                         │
│  ─────────────────────  │
│  [Action] [Action]      │
└─────────────────────────┘
```
- **Elevation**: 2-4dp shadow
- **Radius**: 12px
- **Padding**: 24px
- **Border**: None (use shadow)

### Buttons

**Primary Button**
- Background: Primary-500
- Text: White
- Height: 40px
- Padding: 0 24px
- Radius: 8px
- Shadow: Subtle on hover

**Secondary Button**
- Background: Transparent
- Border: 2px solid Primary-500
- Text: Primary-500
- Height: 40px
- Padding: 0 24px
- Radius: 8px

**Icon Button**
- Size: 40x40px
- Padding: 8px
- Radius: 50% (circle)
- Hover: Background opacity 10%

### Form Inputs
- **Height**: 48px
- **Padding**: 16px
- **Border**: 1px solid Gray-300
- **Radius**: 8px
- **Focus**: Primary-500 border (2px)
- **Label**: Floating or above input

### Tables
- **Header**: Gray-100 background, bold text
- **Row Height**: 56px
- **Padding**: 16px
- **Borders**: Bottom only (Gray-200)
- **Hover**: Gray-50 background
- **Striped**: Optional alternate row colors

---

## 📱 Mobile Responsive Guidelines

### Sidebar Behavior
**Desktop (≥1024px)**
- Always visible
- Fixed position
- Can be collapsed to icon-only mode

**Tablet (768px - 1023px)**
- Collapsed by default
- Expands on click/tap
- Overlay mode

**Mobile (<768px)**
- Hidden by default
- Slide-in drawer on menu button click
- Full overlay backdrop
- Swipe-to-close

### Content Adaptation
**Desktop**
- Multi-column layouts
- Side-by-side forms
- Expanded data tables

**Tablet**
- 2-column layouts
- Stacked forms with side-by-side groups
- Scrollable tables with sticky headers

**Mobile**
- Single column layout
- Full-width forms
- Card-based table views

---

## ✨ Animation & Transitions

### Timing Functions
```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0.0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### Duration
```css
--fast: 150ms;
--normal: 250ms;
--slow: 350ms;
```

### Common Animations
- **Fade In**: opacity 0 → 1 (250ms)
- **Slide In**: translateX(-100%) → 0 (300ms)
- **Scale Up**: scale(0.95) → scale(1) (200ms)
- **Hover Lift**: translateY(0) → translateY(-2px) (200ms)

---

## 🔤 Typography

### Font Family
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

### Font Sizes
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

---

## 🎯 Accessibility

### Color Contrast
- Text: Minimum 4.5:1 ratio (WCAG AA)
- Large text: Minimum 3:1 ratio
- UI components: Minimum 3:1 ratio

### Interactive Elements
- Minimum touch target: 44x44px
- Focus indicators: 2px solid outline
- Keyboard navigation support
- ARIA labels for screen readers

### Form Accessibility
- Labels associated with inputs
- Error messages with ARIA live regions
- Required field indicators
- Clear validation feedback

---

## 🔧 Tailwind CSS Configuration

### Custom Theme Extensions
```javascript
theme: {
  extend: {
    colors: {
      primary: { /* Primary palette */ },
      secondary: { /* Secondary palette */ },
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      info: '#2196F3',
    },
    borderRadius: {
      'card': '12px',
      'button': '8px',
    },
    boxShadow: {
      'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
      'card-hover': '0 4px 16px rgba(0, 0, 0, 0.12)',
      'elevated': '0 8px 24px rgba(0, 0, 0, 0.12)',
    },
  },
}
```

---

## 📦 Component Library

### Reusable Components to Create

1. **AppLayout.vue** - Main layout wrapper with sidebar
2. **Sidebar.vue** - Responsive navigation sidebar
3. **AppStepper.vue** - Wizard/multi-step component
4. **AppCard.vue** - Reusable card component
5. **AppButton.vue** - Standardized button component
6. **AppInput.vue** - Form input component
7. **AppTable.vue** - Data table component
8. **AppModal.vue** - Modal/dialog component
9. **AppAlert.vue** - Alert/notification component
10. **LoadingSpinner.vue** - Loading state component

---

## 🎨 Icon System

### Icon Library
- **Heroicons** (Tailwind's icon set)
- Sizes: 16px, 20px, 24px
- Style: Outline (default), Solid (emphasis)

### Common Icons
- Dashboard: ChartBarIcon
- Reports: DocumentTextIcon
- History: ClockIcon
- Admin: UserGroupIcon
- Profile: UserCircleIcon
- Logout: ArrowRightOnRectangleIcon
- Menu: Bars3Icon
- Close: XMarkIcon
- Success: CheckCircleIcon
- Error: XCircleIcon
- Warning: ExclamationTriangleIcon
- Info: InformationCircleIcon

---

## 🚀 Implementation Steps

1. **Setup Tailwind CSS**
   - Install dependencies
   - Configure tailwind.config.js
   - Update main CSS imports

2. **Create Base Components**
   - Layout components
   - Navigation components
   - Form components

3. **Implement Wizard Pattern**
   - Stepper component
   - Step validation logic
   - State management

4. **Update Existing Views**
   - Wrap in new layout
   - Apply new styling
   - Add responsive behavior

5. **Testing**
   - Test on multiple devices
   - Verify accessibility
   - Performance optimization

---

## 📝 Best Practices

1. **Consistency**: Use design tokens and reusable components
2. **Performance**: Optimize images and lazy-load components
3. **Accessibility**: Follow WCAG 2.1 AA standards
4. **Responsiveness**: Test on real devices, not just browser tools
5. **Maintainability**: Document component props and usage
6. **User Feedback**: Provide clear loading states and error messages

---

## 🎯 Success Metrics

- **Performance**: Page load < 2s
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsiveness**: Works on devices 320px+
- **User Satisfaction**: Clean, intuitive interface
- **Code Quality**: Reusable, maintainable components

---

*Last Updated: 2025-11-14*
*Design System Version: 1.0.0*
