# HX711 Dashboard System

A complete full-stack dashboard system for real-time weight monitoring from ESP32 + HX711 load cells.

## 📁 Structure

- **backend/** - Express.js API server
- **frontend/** - React.js interactive dashboard
- **README.md** - Full documentation
- **QUICKSTART.md** - Quick setup guide

## 🚀 Quick Start

1. **Backend:**
   ```bash
   cd backend && npm install && npm start
   ```

2. **Frontend (new terminal):**
   ```bash
   cd frontend && npm install && npm start
   ```

3. **Update ESP32** with your PC's IP in sketch

4. **Open** http://localhost:3000

## 📊 What You Get

✅ Real-time weight monitoring  
✅ Interactive charts with Chart.js  
✅ Multi-device support  
✅ Device statistics & trends  
✅ Responsive web dashboard  
✅ REST API for ESP32 integration  

## 📖 Documentation

- See [README.md](README.md) for full documentation
- See [QUICKSTART.md](QUICKSTART.md) for setup steps
- Check backend/server.js for API endpoints

## 🔧 Backend Features

- ✅ Receive weight data from ESP32 via POST `/api/weight`
- ✅ Store in-memory (configurable to database)
- ✅ RESTful API with 6+ endpoints
- ✅ Device discovery and statistics
- ✅ CORS enabled for frontend

## 🎨 Frontend Features

- ✅ Device selector dropdown
- ✅ Real-time current reading display
- ✅ Multi-line interactive chart
- ✅ Statistics (avg, min, max)
- ✅ Auto-refresh settings
- ✅ Responsive design (mobile, tablet, desktop)

## 🔌 ESP32 Integration

Update your HX711 sketch:
```cpp
backendConfig.baseUrl = "http://192.168.1.50:3000/api/weight";  // Use your IP
```

Then the sketch will automatically POST readings to the dashboard.

## 📱 Browser Compatibility

Works on all modern browsers:
- Chrome/Edge
- Firefox
- Safari
- Mobile browsers

---

**For more details, see [QUICKSTART.md](QUICKSTART.md) or [README.md](README.md)**
