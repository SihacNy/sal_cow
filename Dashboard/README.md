# HX711 Load Cell Dashboard

A real-time web dashboard for monitoring HX711 load cell data from ESP32 devices. Built with Express.js backend and React.js frontend with Chart.js visualization.

## Features

✅ **Real-time Weight Monitoring** - Live weight display with multiple filter levels  
✅ **Interactive Charts** - View weight trends over time with Chart.js  
✅ **Multi-Device Support** - Connect and monitor multiple ESP32 devices  
✅ **Statistics** - Average, min, max weight calculations  
✅ **Responsive Design** - Works on desktop, tablet, and mobile  
✅ **Device Selection** - Switch between connected devices  
✅ **Auto-refresh** - Configurable refresh intervals (2s, 5s, 10s, 30s)  

## Project Structure

```
Dashboard/
├── backend/          # Express.js API server
│   ├── server.js     # Main server with routes
│   └── package.json  # Backend dependencies
└── frontend/         # React.js dashboard
    ├── src/
    │   ├── App.js    # Main React component
    │   ├── App.css   # Styling
    │   ├── index.js  # React entry point
    │   └── index.css # Global styles
    ├── public/
    │   └── index.html
    └── package.json  # Frontend dependencies
```

## Backend API Endpoints

### POST `/api/weight`
Receive weight data from ESP32 device.

**Request Body:**
```json
{
  "device_id": "esp32-scale-01",
  "raw": 123.4,
  "median": 122.9,
  "lpf": 123.0,
  "display": 123.0,
  "stable": true
}
```

**Response:**
```json
{
  "status": "ok",
  "message": "Received reading from esp32-scale-01",
  "data": { ... }
}
```

### GET `/api/devices`
List all connected devices with current weight and stats.

**Response:**
```json
{
  "status": "ok",
  "devices": [
    {
      "deviceId": "esp32-scale-01",
      "name": "esp32-scale-01",
      "lastUpdate": "2026-06-15T10:30:45.123Z",
      "readingCount": 150,
      "currentWeight": 123.45
    }
  ],
  "count": 1
}
```

### GET `/api/weights/:deviceId`
Get all readings for a specific device.

**Query Parameters:**
- `limit` (optional): Max number of readings to return (default: 100)

**Response:**
```json
{
  "status": "ok",
  "deviceId": "esp32-scale-01",
  "count": 100,
  "readings": [ ... ]
}
```

### GET `/api/weights/:deviceId/latest`
Get the latest reading for a device.

### GET `/api/weights/:deviceId/stats`
Get statistics (average, min, max) for a device.

### DELETE `/api/weights/:deviceId`
Clear all readings for a device.

### GET `/api/health`
Health check endpoint.

## Setup Instructions

### Prerequisites
- Node.js (v14+) and npm
- ESP32 with HX711 sketch configured

### Backend Setup

1. Navigate to backend folder:
```bash
cd Dashboard/backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The backend will run on `http://localhost:3000`

**Development mode (with auto-restart):**
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd Dashboard/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The frontend will open at `http://localhost:3000` (different port if 3000 is taken).

### ESP32 Configuration

Update your HX711 sketch with the correct backend URL:

```cpp
backendConfig.baseUrl = "http://192.168.1.50:3000/api/weight";  // Use your PC's LAN IP
```

Replace `192.168.1.50` with your PC's actual IP address.

## Usage

1. **Start Backend:**
```bash
cd Dashboard/backend
npm install
npm start
```

2. **Start Frontend (in another terminal):**
```bash
cd Dashboard/frontend
npm install
npm start
```

3. **Flash ESP32:**
   - Update the backend URL in the sketch
   - Flash the sketch to your ESP32

4. **Monitor Dashboard:**
   - Open `http://localhost:3000` in browser
   - Select your device from dropdown
   - Watch real-time weight data stream in

## Testing with cURL

Test the backend without the React frontend:

```bash
# Send a test reading
curl -X POST http://localhost:3000/api/weight \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "esp32-scale-01",
    "raw": 123.4,
    "median": 122.9,
    "lpf": 123.0,
    "display": 123.0,
    "stable": true
  }'

# Get all devices
curl http://localhost:3000/api/devices

# Get readings for a device
curl http://localhost:3000/api/weights/esp32-scale-01

# Get device statistics
curl http://localhost:3000/api/weights/esp32-scale-01/stats

# Get latest reading
curl http://localhost:3000/api/weights/esp32-scale-01/latest
```

## Data Storage

The backend uses in-memory storage by default. This means:
- ✅ **Pros:** Fast, no database setup needed, perfect for development
- ❌ **Cons:** Data is lost when server restarts, not suitable for production

**For Production:** Replace in-memory store with MongoDB, PostgreSQL, or Firebase.

## Dashboard Features

### Device Selection
- Dropdown to switch between connected ESP32 devices
- Shows last update time and reading count for each device

### Current Reading Display
- Live weight display (filtered display value)
- All filter levels: Raw, Median, LPF
- Stability indicator
- Timestamp of reading

### Statistics Panel
- Average weight
- Minimum weight
- Maximum weight  
- Total readings count

### Interactive Chart
- Line chart showing weight trends
- Multiple datasets: Display, LPF, and Median values
- Hover for detailed values
- Automatic update based on refresh interval

### Settings
- Adjustable auto-refresh interval
- 2s, 5s, 10s, or 30s options

## Network Setup

**Make sure:**
1. ESP32 and PC are on the same WiFi network
2. Use your PC's **LAN IP** (e.g., 192.168.1.50), not localhost
3. Backend is running and accessible
4. Port 3000 is not blocked by firewall

**Find your PC's IP:**

Windows:
```bash
ipconfig
# Look for "IPv4 Address: 192.168.x.x"
```

macOS/Linux:
```bash
ifconfig
# Look for inet address
```

## Troubleshooting

### ESP32 shows "DNS Failed for YOUR_SERVER_IP"
- Replace the placeholder with your actual PC IP address
- Example: `http://192.168.1.50:3000/api/weight`

### Frontend can't connect to backend
- Check if backend is running: `curl http://localhost:3000/api/health`
- Verify port 3000 is not in use
- Check firewall settings

### No devices appearing
- Wait a few seconds for ESP32 to connect and send first reading
- Check ESP32 serial monitor for connection status
- Verify backend is receiving data with `curl http://localhost:3000/api/devices`

### Data not updating
- Check refresh interval setting in dashboard
- Verify ESP32 is connected to WiFi
- Check ESP32 serial output for errors

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with WebSocket support

## Performance Notes

- Backend keeps last 1000 readings per device (configurable)
- Frontend loads last 100 readings by default (adjustable with `?limit=200`)
- Refresh interval can be set to 2s for real-time monitoring

## Future Enhancements

- [ ] Database persistence (MongoDB/PostgreSQL)
- [ ] User authentication
- [ ] Data export (CSV/JSON)
- [ ] Historical data viewer
- [ ] Alert thresholds
- [ ] Multiple chart types (bar, area)
- [ ] Dark mode
- [ ] Push notifications

## License

MIT

## Support

For issues or questions, check:
1. ESP32 serial output for connection status
2. Backend console for API errors
3. Browser console for frontend errors

---

**Built with ❤️ for ESP32 + HX711 enthusiasts**
