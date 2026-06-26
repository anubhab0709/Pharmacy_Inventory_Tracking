# 💊 Pharmacy Stock & Expiry Tracker

A complete **Pharmacy Inventory Management System** built with **React JS** and **pure CSS** (no TailwindCSS). This application helps pharmacies manage their medicine inventory, track stock levels, monitor expiry dates, and receive alerts for low stock and near-expiry items.

![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.0.8-646CFF?logo=vite)
![CSS3](https://img.shields.io/badge/CSS3-Pure_CSS-1572B6?logo=css3)

---

## ✨ Features

### 📊 Dashboard
- **Total Medicines Overview**: View total count of unique medicines
- **Total Stock Display**: Monitor overall inventory levels
- **Low Stock Alerts**: Get notified when medicines fall below 10 units
- **Expiry Warnings**: Track medicines expiring within 30 days
- **Visual Charts**: Bar chart and pie chart for category distribution using Recharts
- **Quick Navigation**: Click on cards to navigate to relevant pages

### 💊 Medicines Management
- **Complete CRUD Operations**: Add, Edit, Delete medicines
- **Advanced Search**: Search by medicine name or manufacturer
- **Category Filtering**: Filter medicines by category
- **Multiple Sort Options**: Sort by name, stock, expiry date, or category
- **Pagination**: Navigate large lists with 10 items per page
- **Batch Information**: Track manufacturer and batch numbers

### 📅 Expiry Tracker
- **Automatic Expiry Monitoring**: Real-time calculation of days until expiry
- **Color-Coded Status**:
  - 🚨 **Expired**: Already expired medicines
  - ⚠️ **Critical**: Expiring within 30 days
  - ⏰ **Warning**: Expiring within 90 days
  - ✅ **Good**: More than 90 days remaining
- **Smart Filtering**: Filter by expiry status
- **Sorted by Urgency**: Automatically sorted by expiry date

### 📦 Stock Tracker
- **Stock Level Monitoring**: Track inventory levels in real-time
- **Status Indicators**:
  - 🚫 **Out of Stock**: 0 units
  - ⚠️ **Critical**: Less than 10 units
  - 📦 **Low**: Less than 30 units
  - ✅ **Good**: 30+ units
- **Reorder Alerts**: Urgent notifications for out-of-stock items
- **Priority Sorting**: Sorted by lowest stock first

### 🎨 UI/UX Features
- **Pure CSS Styling**: No TailwindCSS - clean, custom CSS
- **Responsive Design**: Mobile-friendly layout using Flexbox and Grid
- **Smooth Animations**: Hover effects and transitions
- **Toast Notifications**: Success/error feedback for all actions
- **Confirmation Modals**: Prevent accidental deletions
- **Color-Coded Badges**: Visual status indicators throughout
- **Gradient Backgrounds**: Modern aesthetic with purple gradients

---

## 🚀 Tech Stack

- **Frontend Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.8
- **Routing**: React Router DOM 6.20.0
- **Charts**: Recharts 2.10.3
- **Notifications**: React Toastify 9.1.3
- **API**: JSON Server 0.17.4
- **Styling**: Pure CSS / CSS Modules

---

## 📁 Project Structure

```
pharmacy/
├── src/
│   ├── api/
│   │   └── medicinesApi.js          # API methods for CRUD operations
│   ├── components/
│   │   ├── Button.jsx & Button.css  # Reusable button component
│   │   ├── Card.jsx & Card.css      # Dashboard card component
│   │   ├── Input.jsx & Input.css    # Form input component
│   │   ├── Modal.jsx & Modal.css    # Confirmation modal
│   │   ├── Navbar.jsx & Navbar.css  # Top navigation bar
│   │   ├── Sidebar.jsx & Sidebar.css # Side navigation menu
│   │   └── Table.jsx & Table.css    # Data table component
│   ├── pages/
│   │   ├── Dashboard.jsx & Dashboard.css       # Main dashboard
│   │   ├── Medicines.jsx & Medicines.css       # Medicines list
│   │   ├── AddMedicine.jsx & Form.css          # Add medicine form
│   │   ├── EditMedicine.jsx                    # Edit medicine form
│   │   ├── ExpiryTracker.jsx & Tracker.css     # Expiry monitoring
│   │   └── StockTracker.jsx                    # Stock monitoring
│   ├── styles/
│   │   ├── globals.css              # Global styles and variables
│   │   └── layout.css               # Layout utilities
│   ├── App.jsx                      # Main app component with routing
│   └── main.jsx                     # App entry point
├── db.json                          # JSON Server database
├── index.html                       # HTML template
├── package.json                     # Dependencies
└── vite.config.js                   # Vite configuration
```

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**

### Step 1: Clone or Navigate to Project
```bash
cd /Users/anubhabbhattacharjee/Desktop/pharmacy
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- React & React DOM
- React Router DOM
- Recharts (for charts)
- React Toastify (for notifications)
- JSON Server (for mock API)
- Vite & plugins

### Step 3: Start JSON Server (Backend API)
Open a **new terminal** and run:
```bash
npm run server
```

This starts the JSON Server on `http://localhost:5000`

The database file (`db.json`) contains sample medicine data.

### Step 4: Start React App (Frontend)
In another terminal, run:
```bash
npm run dev
```

This starts the React app on `http://localhost:3000`

The app will automatically open in your browser.

---

## 🎯 Usage Guide

### Adding a New Medicine
1. Click **"Add New Medicine"** button on Medicines page
2. Fill in the form:
   - Medicine Name (required)
   - Category (required)
   - Stock Quantity (required, must be ≥ 0)
   - Expiry Date (required)
   - Manufacturer (optional)
   - Batch Number (optional)
3. Click **"Add Medicine"**
4. Success notification appears

### Editing a Medicine
1. Navigate to **Medicines** page
2. Click the **edit icon (✏️)** on any medicine row
3. Update the fields
4. Click **"Update Medicine"**

### Deleting a Medicine
1. Navigate to **Medicines** page
2. Click the **delete icon (🗑️)** on any medicine row
3. Confirm deletion in the modal
4. Medicine is removed

### Monitoring Expiry
1. Go to **Expiry Tracker** page
2. View statistics: Expired, Critical, Warning
3. Use filter buttons to view specific status
4. Click edit to update medicine details

### Monitoring Stock
1. Go to **Stock Tracker** page
2. View statistics: Out of Stock, Critical, Low
3. Filter by stock status
4. Reorder medicines as needed

---

## 🎨 Color Coding System

### Stock Levels
- 🚫 **Red Badge**: Out of Stock (0 units)
- ⚠️ **Orange Badge**: Critical (< 10 units)
- ⏰ **Yellow Badge**: Low (< 30 units)
- ✅ **Green Badge**: Good (≥ 30 units)

### Expiry Status
- 🚨 **Red Badge**: Expired
- ⚠️ **Orange Badge**: Expiring within 30 days
- ⏰ **Yellow Badge**: Expiring within 90 days
- ✅ **Green Badge**: Good (> 90 days)

---

## 🔧 API Endpoints

JSON Server provides the following endpoints:

- `GET /medicines` - Get all medicines
- `GET /medicines/:id` - Get single medicine
- `POST /medicines` - Add new medicine
- `PUT /medicines/:id` - Update medicine
- `DELETE /medicines/:id` - Delete medicine

---

## 📊 Sample Data

The `db.json` file includes 10 sample medicines:
- Paracetamol, Amoxicillin, Ibuprofen
- Aspirin, Omeprazole, Metformin
- Lisinopril, Cetirizine, Azithromycin
- Vitamin D3

Categories included:
- Pain Relief
- Antibiotic
- Gastric
- Diabetes
- Blood Pressure
- Allergy
- Supplement

---

## 🎓 React Concepts Used

- ✅ **Functional Components** with JSX
- ✅ **Props** for component reusability
- ✅ **useState** for local state management
- ✅ **useEffect** for side effects and data fetching
- ✅ **React Router** for navigation
- ✅ **Conditional Rendering**
- ✅ **Event Handling**
- ✅ **Form Handling** with controlled components
- ✅ **Array Methods** (map, filter, sort, reduce)
- ✅ **Date Manipulation** for expiry calculations
- ✅ **Component Composition**

---

## 📱 Responsive Design

The application is fully responsive:
- **Desktop**: Full sidebar with labels, grid layouts
- **Tablet**: Optimized for medium screens
- **Mobile**: Icon-only sidebar, stacked layouts

---

## 🚀 Build for Production

To create a production build:

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

To preview the production build:
```bash
npm run preview
```

---

## 🔮 Future Enhancements

- Add user authentication
- Implement medicine barcode scanning
- Add PDF report generation
- Email notifications for expiring medicines
- Multi-pharmacy support
- Advanced analytics dashboard
- Medicine price tracking
- Supplier management
- Purchase order generation

---

## 🐛 Troubleshooting

### JSON Server not starting
- Ensure port 5000 is not in use
- Try `npx json-server --watch db.json --port 5001`
- Update `API_BASE_URL` in `medicinesApi.js`

### React app not starting
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm run dev -- --force`

### API calls failing
- Ensure JSON Server is running
- Check browser console for errors
- Verify `http://localhost:5000/medicines` is accessible

---

## 👨‍💻 Developer

Created as a complete Pharmacy Management System demonstrating:
- React best practices
- Pure CSS styling (no frameworks)
- RESTful API integration
- Responsive design
- Component-based architecture

---

## 📄 License

This project is created for educational purposes.

---

## 🙏 Acknowledgments

- React team for the amazing framework
- Recharts for beautiful chart components
- React Toastify for elegant notifications
- JSON Server for quick backend prototyping

---

**Happy Coding! 💊✨**
