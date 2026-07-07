# Quick Start Guide

## 1. Start Backend (Terminal 1)
```bash
cd Dashboard/backend
npm install
npm start
```
✅ Backend runs on http://localhost:3000

## 2. Start Frontend (Terminal 2)
```bash
cd Dashboard/frontend
npm install
npm start
```
✅ Frontend opens at http://localhost:3000 (or next available port)

## 3. Update ESP32 Sketch
In `examples/HX711_full_example2/HX711_fullexample2.ino`:

Find this line (around line 271):
```cpp
backendConfig.baseUrl = "http://YOUR_SERVER_IP:3000/api/weight";
```

Replace with your PC's LAN IP:
```cpp
backendConfig.baseUrl = "http://192.168.1.50:3000/api/weight";  // Use your actual IP
```

## 4. Flash ESP32
- Build and upload the sketch using PlatformIO
- Watch Serial Monitor (115200 baud) for WiFi connection

## 5. View Dashboard
- Open http://localhost:3000 in browser
- Select your ESP32 device
- Watch weight data stream in real-time!

---

## Finding Your PC's IP

### Windows PowerShell
```powershell
ipconfig
# Look for "IPv4 Address: 192.168.x.x" under your active network
```

### macOS/Linux Terminal
```bash
ifconfig
# Look for inet 192.168.x.x under your network interface
```

---

## Testing Backend with Postman

1. **POST** to `http://localhost:3000/api/weight`
2. **Headers:** `Content-Type: application/json`
3. **Body (raw JSON):**
```json
{
  "device_id": "esp32-scale-01",
  "raw": 100.5,
  "median": 100.2,
  "lpf": 100.3,
  "display": 100.3,
  "stable": true
}
```

Expected Response:
```json
{
  "status": "ok",
  "message": "Received reading from esp32-scale-01",
  "data": { ... }
}
```

---

## Useful Commands

### Check if backend is running
```bash
curl http://localhost:3000/api/health
```

### View all connected devices
```bash
curl http://localhost:3000/api/devices
```

### Get latest reading from a device
```bash
curl http://localhost:3000/api/weights/esp32-scale-01/latest
```

### Clear all data for a device
```bash
curl -X DELETE http://localhost:3000/api/weights/esp32-scale-01
```

---

## Troubleshooting Checklist

- [ ] Backend running? Check: `npm start` in backend folder
- [ ] Frontend running? Check: `npm start` in frontend folder
- [ ] ESP32 connected to WiFi? Check: Serial Monitor output
- [ ] Correct IP in sketch? Use your LAN IP, not localhost
- [ ] Firewall allowing port 3000? Check Windows Defender / firewall settings
- [ ] No "DNS Failed" error? Make sure to use numeric IP, not placeholder

---

## Next Steps

1. Install dependencies: `npm install` in both folders
2. Start backend first
3. Start frontend second
4. Update ESP32 sketch and flash
5. Open dashboard and enjoy!

**Questions?** Check the main [README.md](README.md) for detailed documentation.
