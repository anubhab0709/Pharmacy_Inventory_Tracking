# 🚀 Quick Start Guide

## Installation (One-Time Setup)

### Option 1: Automated Setup
```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup
```bash
npm install
```

---

## Running the Application

### Step 1: Start Backend (JSON Server)
Open Terminal 1:
```bash
npm run server
```
✅ Backend running at http://localhost:5000

### Step 2: Start Frontend (React App)
Open Terminal 2:
```bash
npm run dev
```
✅ App running at http://localhost:3000

---

## Quick Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start React development server |
| `npm run server` | Start JSON Server (mock API) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## First-Time Users

After starting the app:

1. **Visit Dashboard** - See overview of your inventory
2. **Add a Medicine** - Click "Add New Medicine" button
3. **View Expiry Tracker** - Monitor medicines expiring soon
4. **Check Stock Tracker** - See low-stock alerts

---

## Project URLs

- **React App**: http://localhost:3000
- **JSON Server**: http://localhost:5000
- **API Endpoint**: http://localhost:5000/medicines

---

## Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Testing the Application

### Sample Actions to Try:
1. ✅ Add a new medicine with future expiry date
2. ✅ Add a medicine with near expiry (next month)
3. ✅ Add a medicine with low stock (< 10 units)
4. ✅ Edit an existing medicine
5. ✅ Delete a medicine (with confirmation)
6. ✅ Search for medicines by name
7. ✅ Filter by category
8. ✅ Sort by different fields
9. ✅ Navigate between pages
10. ✅ View charts on Dashboard

---

## File Structure Overview

```
pharmacy/
├── src/
│   ├── api/              # API integration
│   ├── components/       # Reusable components
│   ├── pages/           # Route pages
│   ├── styles/          # Global CSS
│   ├── App.jsx          # Main app
│   └── main.jsx         # Entry point
├── db.json              # Database
├── package.json         # Dependencies
└── README.md           # Full documentation
```

---

## Need Help?

Check the full **README.md** for:
- Detailed feature documentation
- API endpoint reference
- Component architecture
- Troubleshooting guide
- Future enhancements

---

**Built with ❤️ using React + Pure CSS**
