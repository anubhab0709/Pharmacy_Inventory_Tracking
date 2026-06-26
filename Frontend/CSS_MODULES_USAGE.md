# CSS Modules Components - Usage Examples

This document provides usage examples for all CSS Modules components in the Pharmacy app.

## 📁 Component Structure

Each component follows this pattern:
```
src/components/
├── ComponentName/
│   ├── ComponentName.jsx
│   └── ComponentName.module.css
```

## 🎨 Import Components

```javascript
// Named imports from index
import { Navbar, Sidebar, Card, Table, Input, Select, DateInput, Modal, Toast } from '@/components'

// Or individual imports
import Navbar from '@/components/Navbar/Navbar'
import Card from '@/components/Card/Card'
```

---

## 🧭 Navigation Components

### Navbar

```jsx
import Navbar from '@/components/Navbar/Navbar'

function App() {
  const [language, setLanguage] = useState('EN')

  return (
    <Navbar 
      currentLanguage={language}
      onLanguageChange={(lang) => setLanguage(lang)}
      userName="John Doe"
      userAvatar="/avatar.jpg"
    />
  )
}
```

**Features:**
- Language selector (EN/BN/HIN)
- Profile dropdown with menu
- Mobile responsive hamburger menu
- Date display

---

### Sidebar

```jsx
import Sidebar from '@/components/Sidebar/Sidebar'

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <Sidebar 
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      version="1.0.0"
    />
  )
}
```

**Features:**
- Collapsible (260px ↔ 80px)
- Active route highlighting
- Badge support for notifications
- Mobile overlay drawer

---

## 📦 Layout Components

### Card

```jsx
import Card, { CardSection, CardGrid } from '@/components/Card/Card'

// Basic Card
<Card title="Medicine Details">
  <p>Card content goes here</p>
</Card>

// Card with variants
<Card 
  variant="compact"  // default | compact | bordered | flat
  hoverable
  footer={<button>View Details</button>}
>
  Content
</Card>

// Card with sections
<Card title="Stock Overview">
  <CardSection title="Current Stock">
    <p>150 units</p>
  </CardSection>
  <CardSection title="Low Stock Items">
    <p>5 items</p>
  </CardSection>
</Card>

// Responsive Card Grid
<CardGrid columns={3}>  {/* auto | 2 | 3 | 4 */}
  <Card variant="bordered">Card 1</Card>
  <Card variant="bordered">Card 2</Card>
  <Card variant="bordered">Card 3</Card>
</CardGrid>

// Status Cards
<Card className="status-card status-success">
  <h3>✓ 145</h3>
  <p>In Stock</p>
</Card>
```

**Variants:**
- `default` - Standard padding
- `compact` - Reduced padding
- `bordered` - With border
- `flat` - No shadow

---

## 📊 Data Display Components

### Table

```jsx
import Table from '@/components/Table/Table'

const columns = [
  {
    key: 'name',
    label: 'Medicine Name',
    sortable: true,
    render: (value, row) => <strong>{value}</strong>
  },
  {
    key: 'stock',
    label: 'Stock',
    sortable: true,
    render: (value) => (
      <span className={value < 10 ? 'badge badge-danger' : 'badge badge-success'}>
        {value}
      </span>
    )
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true
  },
  {
    key: 'actions',
    label: 'Actions',
    render: (_, row) => (
      <div className="table-actions">
        <button onClick={() => handleEdit(row)}>Edit</button>
        <button onClick={() => handleDelete(row)}>Delete</button>
      </div>
    )
  }
]

const data = [
  { id: 1, name: 'Paracetamol', stock: 150, category: 'Analgesic' },
  { id: 2, name: 'Aspirin', stock: 5, category: 'Antiplatelet' }
]

<Table
  columns={columns}
  data={data}
  variant="striped"  // default | compact | comfortable | striped
  onRowClick={(row) => console.log('Clicked:', row)}
  isLoading={false}
/>
```

**Variants:**
- `default` - Standard row height
- `compact` - Dense layout
- `comfortable` - Extra padding
- `striped` - Zebra striping

**Features:**
- Sortable columns (click header)
- Custom cell rendering
- Row click handler
- Loading state with spinner
- Empty state message

---

## 📝 Form Components

### Input

```jsx
import Input from '@/components/Form/Input'

// Basic Input
<Input
  label="Medicine Name"
  name="medicineName"
  value={formData.medicineName}
  onChange={(e) => handleChange(e)}
  placeholder="Enter medicine name"
  required
/>

// Input with error
<Input
  label="Email"
  type="email"
  name="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  helpText="We'll never share your email"
/>

// Input with icons
<Input
  label="Search"
  name="search"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  leftIcon={<span>🔍</span>}
  variant="filled"
  size="large"
/>

// Input sizes and variants
<Input size="small" variant="default" />   // Small default
<Input size="medium" variant="filled" />    // Medium filled (default)
<Input size="large" variant="default" />    // Large default
```

**Props:**
- `variant`: `default` | `filled`
- `size`: `small` | `medium` | `large`
- `leftIcon`, `rightIcon`: React nodes
- `error`: Error message (red border + message)
- `helpText`: Help text below input
- `disabled`: Disabled state

---

### Select

```jsx
import Select from '@/components/Form/Select'

const categoryOptions = [
  { value: 'analgesic', label: 'Analgesic' },
  { value: 'antibiotic', label: 'Antibiotic' },
  { value: 'antiseptic', label: 'Antiseptic' }
]

<Select
  label="Category"
  name="category"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  options={categoryOptions}
  placeholder="Select a category"
  required
  error={errors.category}
  helpText="Choose the medicine category"
/>

// Variants and sizes
<Select variant="filled" size="large" />
```

**Props:**
- `options`: Array of `{ value, label }`
- `placeholder`: Placeholder option
- `variant`: `default` | `filled`
- `size`: `small` | `medium` | `large`

---

### DateInput

```jsx
import DateInput from '@/components/Form/DateInput'

const today = new Date().toISOString().split('T')[0]

<DateInput
  label="Expiry Date"
  name="expiryDate"
  value={expiryDate}
  onChange={(e) => setExpiryDate(e.target.value)}
  min={today}
  required
  error={errors.expiryDate}
  helpText="Select expiry date (must be future date)"
/>

// With custom icon
<DateInput
  variant="filled"
  size="large"
/>
```

**Props:**
- `min`, `max`: Date constraints (YYYY-MM-DD)
- `variant`: `default` | `filled`
- `size`: `small` | `medium` | `large`

---

## 💬 Feedback Components

### Modal

```jsx
import Modal from '@/components/Modal/Modal'

function DeleteConfirmation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Delete</button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Deletion"
        size="medium"  // small | medium | large | fullscreen
        footer={
          <>
            <button onClick={() => setIsOpen(false)}>Cancel</button>
            <button onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p>Are you sure you want to delete this medicine?</p>
      </Modal>
    </>
  )
}
```

**Features:**
- ESC key to close (configurable)
- Click overlay to close (configurable)
- Focus trap (Tab navigation contained)
- Accessible ARIA attributes
- Restores focus on close

**Props:**
- `size`: `small` | `medium` | `large` | `fullscreen`
- `closeOnOverlayClick`: Boolean (default: true)
- `closeOnEsc`: Boolean (default: true)
- `showCloseButton`: Boolean (default: true)

---

### Toast

```jsx
import { ToastContainer, useToast } from '@/components/Toast/Toast'

function App() {
  const { toasts, removeToast, showSuccess, showError, showInfo, showWarning } = useToast()

  const handleSave = async () => {
    try {
      await saveMedicine()
      showSuccess('Medicine saved successfully!', 3000)
    } catch (error) {
      showError('Failed to save medicine', 5000)
    }
  }

  return (
    <div>
      <button onClick={handleSave}>Save</button>
      
      {/* Toast Container - place once at app root */}
      <ToastContainer 
        toasts={toasts}
        onRemove={removeToast}
        position="top-right"  // top-right | top-left | bottom-right | bottom-left | top-center | bottom-center
      />
    </div>
  )
}
```

**useToast Hook Methods:**
- `showSuccess(message, duration)`
- `showError(message, duration)`
- `showInfo(message, duration)`
- `showWarning(message, duration)`
- `addToast({ message, type, duration })`
- `removeToast(id)`

**Toast Types:**
- `success` - Green with checkmark
- `error` - Red with X
- `warning` - Yellow with warning icon
- `info` - Blue with info icon

**Features:**
- Auto-dismiss (configurable duration)
- Manual close button
- Animated entrance/exit
- Multiple positions
- Stack multiple toasts

---

## 🎯 Complete Form Example

```jsx
import { Input, Select, DateInput } from '@/components'
import { useState } from 'react'

function AddMedicineForm() {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    stock: '',
    expiryDate: ''
  })
  const [errors, setErrors] = useState({})

  const categoryOptions = [
    { value: 'analgesic', label: 'Analgesic' },
    { value: 'antibiotic', label: 'Antibiotic' }
  ]

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Validate and submit
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Medicine Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
      />

      <Select
        label="Category"
        name="category"
        value={formData.category}
        onChange={handleChange}
        options={categoryOptions}
        error={errors.category}
        required
      />

      <Input
        label="Stock Quantity"
        type="number"
        name="stock"
        value={formData.stock}
        onChange={handleChange}
        error={errors.stock}
        required
      />

      <DateInput
        label="Expiry Date"
        name="expiryDate"
        value={formData.expiryDate}
        onChange={handleChange}
        min={new Date().toISOString().split('T')[0]}
        error={errors.expiryDate}
        required
      />

      <button type="submit">Add Medicine</button>
    </form>
  )
}
```

---

## 🎨 Theme Variables

All components use CSS variables from `src/styles/theme.css`:

```css
/* Colors */
var(--primary)
var(--secondary)
var(--success)
var(--danger)
var(--warning)
var(--info)

/* Spacing */
var(--space-1) to var(--space-16)

/* Typography */
var(--font-size-xs) to var(--font-size-4xl)
var(--font-weight-normal) to var(--font-weight-black)

/* Border Radius */
var(--radius-sm) to var(--radius-full)

/* Shadows */
var(--shadow-sm) to var(--shadow-2xl)

/* Transitions */
var(--transition-base)
var(--transition-all)
```

---

## 📱 Responsive Breakpoints

All components are responsive:

- **Desktop**: > 768px
- **Tablet**: 480px - 768px
- **Mobile**: < 480px

---

## ♿ Accessibility Features

All components include:

- ✅ ARIA attributes (`aria-label`, `aria-invalid`, `aria-describedby`)
- ✅ Keyboard navigation (Tab, Enter, ESC)
- ✅ Focus states (visible outlines)
- ✅ Screen reader support
- ✅ Semantic HTML
- ✅ Focus trap (Modal)
- ✅ Live regions (Toast)

---

## 🚀 Quick Start

1. **Import components:**
   ```javascript
   import { Card, Table, Input } from '@/components'
   ```

2. **Use in your pages:**
   ```jsx
   <Card title="Medicine List">
     <Table columns={columns} data={data} />
   </Card>
   ```

3. **Customize with variants:**
   ```jsx
   <Card variant="bordered" hoverable>
     <Input variant="filled" size="large" />
   </Card>
   ```

---

## 📚 Additional Resources

- **Theme System**: `src/styles/theme.css`
- **Global Styles**: `src/styles/globals.css`
- **Layout Styles**: `src/styles/layout.css`
- **Component Exports**: `src/components/index.js`

---

## 🆘 Common Patterns

### Loading State
```jsx
<Table data={data} isLoading={isLoading} />
```

### Error Handling
```jsx
<Input error={errors.name} />
<Select error={errors.category} />
```

### Confirmation Dialog
```jsx
<Modal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  title="Confirm Action"
  footer={
    <>
      <button onClick={handleCancel}>Cancel</button>
      <button onClick={handleConfirm}>Confirm</button>
    </>
  }
>
  <p>Are you sure?</p>
</Modal>
```

### Success Notification
```jsx
const { showSuccess } = useToast()
showSuccess('Operation completed!', 3000)
```

---

**Note**: All components use CSS Modules for scoped styling. Import `.module.css` files are automatically handled by Vite. No global CSS pollution! 🎉
