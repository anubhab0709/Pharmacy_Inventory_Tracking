# 🏗️ Application Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PHARMACY TRACKER APP                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Navbar     │    │   Routing    │    │  Toast       │  │
│  │  (Header)    │    │  (Routes)    │    │  Notifications│  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                               │
│  ┌──────────────┬───────────────────────────────────────┐  │
│  │   Sidebar    │         Main Content Area             │  │
│  │              │                                        │  │
│  │ - Dashboard  │  ┌────────────────────────────────┐  │  │
│  │ - Medicines  │  │                                │  │  │
│  │ - Add        │  │        PAGE COMPONENTS         │  │  │
│  │ - Expiry     │  │                                │  │  │
│  │ - Stock      │  │  • Dashboard (Charts + Stats)  │  │  │
│  │              │  │  • Medicines (Table + CRUD)    │  │  │
│  └──────────────┤  │  • Add/Edit Forms             │  │  │
│                  │  │  • Expiry Tracker             │  │  │
│                  │  │  • Stock Tracker              │  │  │
│                  │  │                                │  │  │
│                  │  └────────────────────────────────┘  │  │
│                  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App
├── Navbar
├── Sidebar
├── Routes
│   ├── Dashboard
│   │   ├── Card (x4)
│   │   ├── BarChart
│   │   └── PieChart
│   ├── Medicines
│   │   ├── Search Input
│   │   ├── Filter Selects
│   │   ├── Table
│   │   ├── Modal (Delete Confirmation)
│   │   └── Pagination
│   ├── AddMedicine
│   │   ├── Input (x6)
│   │   └── Button (x2)
│   ├── EditMedicine
│   │   ├── Input (x6)
│   │   └── Button (x2)
│   ├── ExpiryTracker
│   │   ├── Stat Cards (x3)
│   │   ├── Filter Buttons
│   │   └── Table
│   └── StockTracker
│       ├── Stat Cards (x3)
│       ├── Filter Buttons
│       ├── Alert (if out of stock)
│       └── Table
└── ToastContainer
```

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                         USER ACTION                          │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│                    REACT COMPONENT                           │
│  • useState (local state)                                    │
│  • useEffect (side effects)                                  │
│  • Event Handlers                                            │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
│  (medicinesApi.js)                                           │
│  • getMedicines()                                            │
│  • addMedicine(data)                                         │
│  • updateMedicine(id, data)                                  │
│  • deleteMedicine(id)                                        │
│  • getDashboardStats()                                       │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│                    JSON SERVER                               │
│  http://localhost:5000/medicines                             │
│  • GET, POST, PUT, DELETE                                    │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│                       db.json                                │
│  { medicines: [...] }                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## State Management

### Local State (useState)
Each component manages its own state:

**Dashboard:**
```javascript
- stats (dashboard statistics)
- loading (loading state)
- categoryData (chart data)
```

**Medicines:**
```javascript
- medicines (all medicines)
- filteredMedicines (filtered results)
- searchTerm (search input)
- filterCategory (category filter)
- sortBy (sort option)
- currentPage (pagination)
- deleteModal (modal state)
```

**Add/Edit Medicine:**
```javascript
- formData (form fields)
- loading (submit state)
```

**Trackers:**
```javascript
- medicines (with calculated status)
- loading (loading state)
- filter (active filter)
```

---

## Routing Structure

```
/                    → Dashboard
/medicines           → Medicines List
/add-medicine        → Add Medicine Form
/edit-medicine/:id   → Edit Medicine Form
/expiry-tracker      → Expiry Monitoring
/stock-tracker       → Stock Monitoring
```

---

## CSS Architecture

### Global Styles
- `globals.css` - Variables, reset, utilities, animations
- `layout.css` - Grid, flex, responsive layouts

### Component Styles
Each component has its own CSS file:
- Scoped to component
- BEM-like naming convention
- Responsive breakpoints

### Color System
```css
Primary Gradient: #667eea → #764ba2 (Purple)
Success: #48bb78 (Green)
Warning: #ed8936 (Orange)
Danger: #f56565 (Red)
Info: #4299e1 (Blue)
```

---

## Key Features Implementation

### 1. Stock Level Tracking
```javascript
const getStockStatus = (stock) => {
  if (stock === 0) return 'out-of-stock'
  if (stock < 10) return 'critical'
  if (stock < 30) return 'low'
  return 'good'
}
```

### 2. Expiry Date Calculation
```javascript
const expiryDate = new Date(medicine.expiryDate)
const today = new Date()
const daysUntilExpiry = Math.ceil(
  (expiryDate - today) / (1000 * 60 * 60 * 24)
)
```

### 3. Search & Filter
```javascript
// Search by name or manufacturer
filtered = medicines.filter(m =>
  m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  m.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
)

// Filter by category
filtered = filtered.filter(m => m.category === filterCategory)

// Sort
filtered.sort((a, b) => a.name.localeCompare(b.name))
```

### 4. Pagination
```javascript
const itemsPerPage = 10
const indexOfLastItem = currentPage * itemsPerPage
const indexOfFirstItem = indexOfLastItem - itemsPerPage
const currentItems = medicines.slice(indexOfFirstItem, indexOfLastItem)
```

---

## API Structure

### Base URL
```
http://localhost:5000
```

### Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /medicines | Get all medicines |
| GET | /medicines/:id | Get one medicine |
| POST | /medicines | Add new medicine |
| PUT | /medicines/:id | Update medicine |
| DELETE | /medicines/:id | Delete medicine |

### Medicine Schema
```json
{
  "id": "string",
  "name": "string",
  "category": "string",
  "stock": "number",
  "expiryDate": "YYYY-MM-DD",
  "manufacturer": "string",
  "batchNumber": "string"
}
```

---

## Performance Optimizations

1. **useEffect Dependencies**: Proper dependency arrays to prevent unnecessary re-renders
2. **Pagination**: Only render 10 items at a time
3. **Memoization Ready**: Can add useMemo for expensive calculations
4. **Lazy Loading**: Can implement code-splitting with React.lazy()
5. **Debouncing**: Can add debounced search for better UX

---

## Security Considerations

1. **Input Validation**: Form validation before submission
2. **XSS Prevention**: React automatically escapes content
3. **CSRF**: Not applicable for JSON Server (dev only)
4. **Production**: Would need proper backend with auth

---

## Scalability

### Current Limitations
- JSON Server (dev only, in-memory)
- No authentication
- No real-time updates
- Single user

### Production Enhancements
- Replace JSON Server with real backend (Node.js, Django, etc.)
- Add JWT authentication
- Implement WebSocket for real-time updates
- Add user roles (admin, pharmacist, viewer)
- Database (PostgreSQL, MongoDB)
- Cloud deployment (Vercel, Netlify, AWS)

---

## Testing Strategy (Future)

### Unit Tests
- Component rendering
- User interactions
- API calls

### Integration Tests
- Form submissions
- Navigation
- Data flow

### E2E Tests
- Complete user workflows
- CRUD operations
- Navigation flows

---

**Architecture designed for maintainability, scalability, and developer experience!**
