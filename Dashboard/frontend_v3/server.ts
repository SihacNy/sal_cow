import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, Cow, WeightRecord, Device } from './server/db.js';

// Self-heating: configure express server
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Create HTTP and Socket.IO server
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Cache for recent scale data to handle instabilities and status transitions
let liveScaleState = {
  deviceId: 'esp32-scale-01',
  weight: 0,
  stable: false,
  timestamp: new Date().toISOString()
};

// Log of raw readings received for analytics & troubleshooting
let rawReadingsBuffer: any[] = [];

// API: Hardware Endpoint - Post Reading
app.post('/api/weight', (req, res) => {
  const { device_id, raw, median, lpf, display, stable } = req.body;
  
  if (!device_id) {
    return res.status(400).json({ error: 'Missing device_id' });
  }

  const deviceId = String(device_id);
  const displayWeight = typeof display === 'number' ? display : 0;
  const isStable = !!stable;

  // Track the online status of the device
  db.updateDeviceStatus(deviceId, 'online');

  // Push reading to real-time clients through socket
  io.emit('weight_update', {
    deviceId,
    raw: raw ?? displayWeight,
    median: median ?? displayWeight,
    lpf: lpf ?? displayWeight,
    display: displayWeight,
    stable: isStable,
    timestamp: new Date().toISOString()
  });

  // Track live state
  liveScaleState = {
    deviceId,
    weight: displayWeight,
    stable: isStable,
    timestamp: new Date().toISOString()
  };

  // Buffer live reading for transient analytics (capped at 50)
  rawReadingsBuffer.push({ ...liveScaleState, raw });
  if (rawReadingsBuffer.length > 50) rawReadingsBuffer.shift();

  // If stable reading, emit a distinct sound trigger event "new_reading"
  if (isStable && displayWeight > 5) {
    // Only emit new_reading if we transitioned to stable with a meaningful weight
    io.emit('new_reading', {
      deviceId,
      weight: displayWeight,
      timestamp: new Date().toISOString()
    });
  }

  res.json({ success: true, message: 'Reading processed successfully' });
});

// API: Manual Bind / Save Weight Log
app.post('/api/weight-log', (req, res) => {
  const { cowId, deviceId, weight, stable } = req.body;
  if (!cowId || typeof weight !== 'number') {
    return res.status(400).json({ error: 'Missing cowId or weight' });
  }

  // Verify cow exists
  const cow = db.getCowById(cowId);
  if (!cow) {
    return res.status(404).json({ error: 'Cattle not found' });
  }

  const record = db.addWeightRecord({
    cowId: cow.cowId,
    deviceId: deviceId || 'manual',
    weight,
    stable: stable !== undefined ? stable : true
  });

  // Update device status if relevant
  if (deviceId && deviceId !== 'manual') {
    db.updateDeviceStatus(deviceId, 'online');
  }

  // Broadcast the update immediately
  io.emit('db_changed', { type: 'weight_added', record });

  res.status(201).json({ success: true, record });
});

// Simulated WiFi networks nearby devices
const SIMULATED_NETWORKS: Record<string, Array<{ ssid: string; signal: number; secure: boolean; connected: boolean }>> = {
  'esp32-scale-01': [
    { ssid: 'AgroNet_Barn5', signal: 82, secure: true, connected: true },
    { ssid: 'Farmhouse_Extend', signal: 71, secure: true, connected: false },
    { ssid: 'Pasture_B_Solar_AP', signal: 45, secure: true, connected: false },
    { ssid: 'AgroScale_Temporary_AP', signal: 91, secure: false, connected: false }
  ],
  'esp32-scale-02': [
    { ssid: 'AgroNet_Barn5', signal: 25, secure: true, connected: false },
    { ssid: 'Farmhouse_Extend', signal: 62, secure: true, connected: false },
    { ssid: 'Pasture_B_Solar_AP', signal: 89, secure: true, connected: false },
    { ssid: 'AgroScale_Temporary_AP', signal: 78, secure: false, connected: false }
  ]
};

// API: Get online/offline devices
app.get('/api/devices', (req, res) => {
  res.json(db.getDevices());
});

// API: Get nearby WiFi networks scanned by scale device
app.get('/api/devices/:deviceId/networks', (req, res) => {
  const { deviceId } = req.params;
  const networks = SIMULATED_NETWORKS[deviceId] || [
    { ssid: 'AgroNet_Barn5', signal: 65, secure: true, connected: false },
    { ssid: 'Farmhouse_Extend', signal: 78, secure: true, connected: false },
    { ssid: 'AgroScale_Temporary_AP', signal: 95, secure: false, connected: false }
  ];
  res.json(networks);
});

// API: Configure WiFi connection on device (Visual connection simulation)
app.post('/api/devices/:deviceId/wifi', (req, res) => {
  const { deviceId } = req.params;
  const { ssid, password } = req.body;

  if (!ssid) {
    return res.status(400).json({ error: 'Missing SSID' });
  }

  // Set transient db state to "connecting"
  db.updateDeviceWifi(deviceId, {
    ssid,
    status: 'connecting'
  });
  io.emit('db_changed', { type: 'device_wifi_connecting', deviceId });

  // Acknowledge API reception immediately
  res.json({ success: true, message: 'WiFi connection parameters sent to device.' });

  // Progressive simulation steps broadcasted via Socket.IO
  let step = 0;
  const steps = [
    { status: 'connecting', message: `Waking up WiFi stack on scale module ${deviceId}...` },
    { status: 'connecting', message: `Attempting handshake with wireless hub: "${ssid}"...` },
    { status: 'connecting', message: 'Sending configuration payload and WPA2 secret key...' },
    { status: 'connecting', message: 'Registering Client node state with DHCP server...' },
    { status: 'connected', message: `Connected! Assigned IP address. Node active.` }
  ];

  const runSimulationStep = () => {
    if (step >= steps.length) {
      const generatedIP = `192.168.1.${Math.floor(Math.random() * 190) + 40}`;
      const signalValue = Math.floor(Math.random() * 30) + 65; // 65% - 95%

      // Permanent update
      db.updateDeviceWifi(deviceId, {
        ssid,
        ip: generatedIP,
        signal: signalValue,
        status: 'connected'
      });

      // Update in simulated memory to reflect connected
      if (SIMULATED_NETWORKS[deviceId]) {
        SIMULATED_NETWORKS[deviceId] = SIMULATED_NETWORKS[deviceId].map(net => ({
          ...net,
          connected: net.ssid === ssid
        }));
      }

      io.emit('wifi_provision_status', {
        deviceId,
        status: 'connected',
        step: steps.length,
        message: `WiFi Provision Successful! Local IP: ${generatedIP} | Strength: ${signalValue}%`,
        ip: generatedIP,
        signal: signalValue,
        ssid
      });

      io.emit('db_changed', { type: 'device_wifi_connected', deviceId });
      return;
    }

    io.emit('wifi_provision_status', {
      deviceId,
      status: 'connecting',
      step: step + 1,
      message: steps[step].message
    });

    step++;
    setTimeout(runSimulationStep, 1000);
  };

  setTimeout(runSimulationStep, 200);
});

// API: Get weights for a device
app.get('/api/weights/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const records = db.getWeightRecordsByDevice(deviceId);
  res.json(records);
});

// API: Get latest weight for a device
app.get('/api/weights/:deviceId/latest', (req, res) => {
  const { deviceId } = req.params;
  const records = db.getWeightRecordsByDevice(deviceId);
  if (records.length === 0) {
    return res.status(404).json({ error: 'No records found for device' });
  }
  // Sort desc by timestamp
  const sorted = [...records].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(sorted[0]);
});

// API: Get device statistics
app.get('/api/weights/:deviceId/stats', (req, res) => {
  const { deviceId } = req.params;
  const records = db.getWeightRecordsByDevice(deviceId);
  if (records.length === 0) {
    return res.json({ min: 0, max: 0, avg: 0, count: 0 });
  }
  const weights = records.map(r => r.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const sum = weights.reduce((acc, w) => acc + w, 0);
  const avg = Math.round((sum / weights.length) * 10) / 10;
  res.json({ min, max, avg, count: records.length });
});

// API: Delete weight recordings for a device
app.delete('/api/weights/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  db.deleteWeightRecordsByDevice(deviceId);
  io.emit('db_changed', { type: 'weights_deleted', deviceId });
  res.json({ success: true, message: `Cleared recordings for device ${deviceId}` });
});

// COWS CRUD ENDPOINTS
app.get('/api/cows', (req, res) => {
  res.json(db.getCows());
});

app.get('/api/cows/:id', (req, res) => {
  const cow = db.getCowById(req.params.id);
  if (!cow) {
    return res.status(404).json({ error: 'Cattle record not found' });
  }
  res.json(cow);
});

app.post('/api/cows', (req, res) => {
  const { cowId, name, breed, gender, birthDate, image } = req.body;
  if (!cowId || !name || !breed || !gender || !birthDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if cowId already exists to avoid duplication
  const existing = db.getCowById(cowId);
  if (existing) {
    return res.status(400).json({ error: `Cattle with ID ${cowId} already exists` });
  }

  const newCow = db.addCow({ cowId, name, breed, gender, birthDate, image });
  io.emit('db_changed', { type: 'cow_created', cow: newCow });
  res.status(201).json(newCow);
});

app.put('/api/cows/:id', (req, res) => {
  const updated = db.updateCow(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Cattle not found' });
  }
  io.emit('db_changed', { type: 'cow_updated', cow: updated });
  res.json(updated);
});

app.delete('/api/cows/:id', (req, res) => {
  const success = db.deleteCow(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Cattle not found' });
  }
  io.emit('db_changed', { type: 'cow_deleted', id: req.params.id });
  res.json({ success: true });
});

// Get weight records for a specific cow
app.get('/api/cows/:id/weights', (req, res) => {
  const cow = db.getCowById(req.params.id);
  if (!cow) return res.status(404).json({ error: 'Cattle not found' });
  const records = db.getWeightRecordsByCow(cow.cowId);
  res.json(records);
});

// Add weight for a specific cow
app.post('/api/cows/:id/weights', (req, res) => {
  const cow = db.getCowById(req.params.id);
  if (!cow) return res.status(404).json({ error: 'Cattle not found' });

  const { weight, deviceId, stable } = req.body;
  if (typeof weight !== 'number') return res.status(400).json({ error: 'Invalid weight value' });

  const record = db.addWeightRecord({
    cowId: cow.cowId,
    deviceId: deviceId || 'manual',
    weight,
    stable: stable ?? true
  });

  io.emit('db_changed', { type: 'weight_added', record });
  res.status(201).json(record);
});

// Helper: Calculate gain/loss stats of individual cows
function computeHerdStatistics() {
  const cows = db.getCows();
  const records = db.getWeightRecords();

  const cowWeightInfo = cows.map(cow => {
    const cowRecs = [...records.filter(r => r.cowId === cow.cowId)]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // chronological

    if (cowRecs.length === 0) return null;

    const firstRec = cowRecs[0];
    const latestRec = cowRecs[cowRecs.length - 1];
    const previousRec = cowRecs.length > 1 ? cowRecs[cowRecs.length - 2] : null;

    const gainFromPrev = previousRec ? latestRec.weight - previousRec.weight : 0;
    const gainOverall = latestRec.weight - firstRec.weight;
    
    // Average Daily Gain (ADG)
    let adg = 0;
    if (cowRecs.length > 1) {
      const days = (new Date(latestRec.timestamp).getTime() - new Date(firstRec.timestamp).getTime()) / (1000 * 3600 * 24);
      adg = days > 0.5 ? Math.round((gainOverall / days) * 1000) / 1000 : 0; // kg/day
    }

    return {
      cowId: cow.cowId,
      name: cow.name,
      breed: cow.breed,
      currentWeight: latestRec.weight,
      previousWeight: previousRec ? previousRec.weight : null,
      gainFromPrev,
      gainOverall,
      adg,
      lastWeighed: latestRec.timestamp,
      recordsCount: cowRecs.length
    };
  }).filter(Boolean);

  return cowWeightInfo;
}

// DASHBOARD STATS ENDPOINT
app.get('/api/dashboard/stats', (req, res) => {
  const cows = db.getCows();
  const records = db.getWeightRecords();
  const hStats = computeHerdStatistics();

  const totalCows = cows.length;
  
  const currentWeights = hStats.map(h => h!.currentWeight);
  const averageWeight = currentWeights.length > 0
    ? Math.round((currentWeights.reduce((acc, w) => acc + w, 0) / currentWeights.length) * 10) / 10
    : 0;

  // Find heaviest
  let heaviestCow = null;
  let lightestCow = null;
  if (hStats.length > 0) {
    const sortedByWeight = [...hStats].sort((a, b) => b!.currentWeight - a!.currentWeight);
    const hCowObj = cows.find(c => c.cowId === sortedByWeight[0]!.cowId);
    const lCowObj = cows.find(c => c.cowId === sortedByWeight[sortedByWeight.length - 1]!.cowId);
    
    heaviestCow = hCowObj ? { ...hCowObj, weight: sortedByWeight[0]!.currentWeight } : null;
    lightestCow = lCowObj ? { ...lCowObj, weight: sortedByWeight[sortedByWeight.length - 1]!.currentWeight } : null;
  }

  // Filter measurements in today / past 7 days
  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);
  const todayRecs = records.filter(r => new Date(r.timestamp) >= startOfToday);

  const startOf7DaysAgo = new Date();
  startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7);
  const weeklyRecs = records.filter(r => new Date(r.timestamp) >= startOf7DaysAgo);

  const devices = db.getDevices();
  const onlineDevicesCount = devices.filter(d => d.status === 'online').length;

  // Alerts generator:
  const alerts = [];
  
  // Rule 1: Weight Loss
  hStats.forEach(stat => {
    if (stat!.gainFromPrev < -2) { // lost more than 2kg
      alerts.push({
        id: `alert-loss-${stat!.cowId}`,
        type: 'weight_loss',
        severity: 'high',
        cowId: stat!.cowId,
        cowName: stat!.name,
        message: `${stat!.name} (${stat!.cowId}) has lost ${Math.abs(stat!.gainFromPrev).toFixed(1)} kg since last weigh.`,
        timestamp: stat!.lastWeighed
      });
    }
  });

  // Rule 2: Cow not weighed recently (> 30 days in seed, but let's say > 25 days)
  const twentyFiveDaysAgo = new Date();
  twentyFiveDaysAgo.setDate(now.getDate() - 25);
  cows.forEach(cow => {
    const cowStat = hStats.find(s => s!.cowId === cow.cowId);
    if (!cowStat) {
      alerts.push({
        id: `alert-noweigh-none-${cow.cowId}`,
        type: 'not_weighed',
        severity: 'medium',
        cowId: cow.cowId,
        cowName: cow.name,
        message: `${cow.name} (${cow.cowId}) has no weight records in the system.`,
        timestamp: cow.createdAt
      });
    } else {
      const lastWeighedDate = new Date(cowStat.lastWeighed);
      if (lastWeighedDate < twentyFiveDaysAgo) {
        alerts.push({
          id: `alert-noweigh-${cow.cowId}`,
          type: 'not_weighed',
          severity: 'medium',
          cowId: cow.cowId,
          cowName: cow.name,
          message: `${cow.name} (${cow.cowId}) has not been weighed recently (Last: ${lastWeighedDate.toLocaleDateString()}).`,
          timestamp: cowStat.lastWeighed
        });
      }
    }
  });

  // Rule 3: Device Offline
  devices.forEach(d => {
    if (d.status === 'offline') {
      alerts.push({
        id: `alert-device-${d.deviceId}`,
        type: 'device_offline',
        severity: 'high',
        message: `Weighing scale ${d.deviceId} is offline.`,
        timestamp: d.lastSeen
      });
    }
  });

  // Sort alerts chronological
  alerts.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Recent activity log
  const recentActivities = [...records]
    .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)
    .map(r => {
      const cow = cows.find(c => c.cowId === r.cowId);
      return {
        id: r.id,
        type: 'weigh-in',
        cowId: r.cowId,
        cowName: cow ? cow.name : 'Unknown Cattle',
        breed: cow ? cow.breed : 'N/A',
        weight: r.weight,
        timestamp: r.timestamp,
        deviceId: r.deviceId,
        logo: cow ? cow.image : null
      };
    });

  res.json({
    totalCows,
    averageWeight,
    heaviestCow,
    lightestCow,
    todayMeasurementsCount: todayRecs.length,
    weeklyMeasurementsCount: weeklyRecs.length,
    onlineDevices: onlineDevicesCount,
    alerts: alerts.slice(0, 6),
    recentActivity: recentActivities,
    liveScale: liveScaleState
  });
});

// REPORTS API Endpoints
// Daily Report
app.get('/api/reports/daily', (req, res) => {
  const hStats = computeHerdStatistics();
  const records = db.getWeightRecords();
  
  // Gain vs Loss analysis
  const weightGained = hStats.filter(s => s!.gainFromPrev > 0).length;
  const weightLost = hStats.filter(s => s!.gainFromPrev < 0).length;
  const unchanged = hStats.length - weightGained - weightLost;

  // Most Improved & Least Improved
  const sortedByGain = [...hStats].sort((a, b) => b!.gainOverall - a!.gainOverall);
  const mostImproved = sortedByGain.length > 0 ? sortedByGain[0] : null;
  const leastImproved = sortedByGain.length > 1 ? sortedByGain[sortedByGain.length - 1] : null;

  // Let's gather the averages over the last 10 days for charting
  const dailyGraph: any[] = [];
  const now = new Date();
  
  for (let i = 9; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dayStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    
    // Get all records up to and on this day to find average current weights
    const startOfDay = new Date(d);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(d);
    endOfDay.setHours(23,59,59,999);

    const recsOnDay = records.filter(r => {
      const t = new Date(r.timestamp);
      return t >= startOfDay && t <= endOfDay;
    });

    const avgOnDay = recsOnDay.length > 0
      ? Math.round((recsOnDay.reduce((acc, r) => acc + r.weight, 0) / recsOnDay.length) * 10) / 10
      : null;

    dailyGraph.push({
      label: dayStr,
      avgWeight: avgOnDay || (dailyGraph[dailyGraph.length - 1]?.avgWeight ?? 240), // fallback gracefully for chart
      count: recsOnDay.length
    });
  }

  res.json({
    summary: {
      averageWeight: hStats.length > 0 ? Math.round((hStats.reduce((acc, h) => acc + h!.currentWeight, 0) / hStats.length) * 10) / 10 : 0,
      cowsGainedRate: Math.round((weightGained / (hStats.length || 1)) * 100),
      cowsLostRate: Math.round((weightLost / (hStats.length || 1)) * 100),
      mostImproved: mostImproved ? { cowId: mostImproved.cowId, name: mostImproved.name, gain: mostImproved.gainOverall } : null,
      leastImproved: leastImproved ? { cowId: leastImproved.cowId, name: leastImproved.name, gain: leastImproved.gainOverall } : null,
    },
    chartData: dailyGraph,
    details: hStats
  });
});

// Weekly Report (covers past 4 weeks)
app.get('/api/reports/weekly', (req, res) => {
  const hStats = computeHerdStatistics();
  const records = db.getWeightRecords();

  const weightGained = hStats.filter(s => s!.gainFromPrev > 0).length;
  const weightLost = hStats.filter(s => s!.gainFromPrev < 0).length;

  const sortedByGain = [...hStats].sort((a, b) => b!.adg - a!.adg);
  const mostImproved = sortedByGain.length > 0 ? sortedByGain[0] : null;
  const leastImproved = sortedByGain.length > 1 ? sortedByGain[sortedByGain.length - 1] : null;

  // Let's mock a weekly progression for the last 4 weeks of the herd
  const weeklyGraph = [
    { label: 'Week 1', avgWeight: 232.5, count: 5 },
    { label: 'Week 2', avgWeight: 235.1, count: 6 },
    { label: 'Week 3', avgWeight: 238.4, count: 4 },
    { label: 'Week 4', avgWeight: 242.0, count: 8 }
  ];

  res.json({
    summary: {
      averageWeight: hStats.length > 0 ? Math.round((hStats.reduce((acc, h) => acc + h!.currentWeight, 0) / hStats.length) * 10) / 10 : 0,
      cowsGainedRate: Math.round((weightGained / (hStats.length || 1)) * 100),
      cowsLostRate: Math.round((weightLost / (hStats.length || 1)) * 100),
      mostImproved: mostImproved ? { cowId: mostImproved.cowId, name: mostImproved.name, gain: mostImproved.gainOverall } : null,
      leastImproved: leastImproved ? { cowId: leastImproved.cowId, name: leastImproved.name, gain: leastImproved.gainOverall } : null,
    },
    chartData: weeklyGraph,
    details: hStats
  });
});

// Monthly Report (covers past 6 months)
app.get('/api/reports/monthly', (req, res) => {
  const hStats = computeHerdStatistics();
  const records = db.getWeightRecords();

  const weightGained = hStats.filter(s => s!.gainOverall > 0).length;
  const weightLost = hStats.filter(s => s!.gainOverall < 0).length;

  const sortedByGain = [...hStats].sort((a, b) => b!.gainOverall - a!.gainOverall);
  const mostImproved = sortedByGain.length > 0 ? sortedByGain[0] : null;
  const leastImproved = sortedByGain.length > 1 ? sortedByGain[sortedByGain.length - 1] : null;

  // Build real monthly aggregation from the generated records
  const monthlyGraph: any[] = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = d.toLocaleString(undefined, { month: 'short' });
    
    // Get all records in this month
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    const recsInMonth = records.filter(r => {
      const t = new Date(r.timestamp);
      return t >= startOfMonth && t <= endOfMonth;
    });

    const avgInMonth = recsInMonth.length > 0
      ? Math.round((recsInMonth.reduce((acc, r) => acc + r.weight, 0) / recsInMonth.length) * 10) / 10
      : 230 + (5 - i) * 3; // sensible default trend line

    monthlyGraph.push({
      label: monthLabel,
      avgWeight: avgInMonth,
      count: recsInMonth.length
    });
  }

  res.json({
    summary: {
      averageWeight: hStats.length > 0 ? Math.round((hStats.reduce((acc, h) => acc + h!.currentWeight, 0) / hStats.length) * 10) / 10 : 0,
      cowsGainedRate: Math.round((weightGained / (hStats.length || 1)) * 100),
      cowsLostRate: Math.round((weightLost / (hStats.length || 1)) * 100),
      mostImproved: mostImproved ? { cowId: mostImproved.cowId, name: mostImproved.name, gain: mostImproved.gainOverall } : null,
      leastImproved: leastImproved ? { cowId: leastImproved.cowId, name: leastImproved.name, gain: leastImproved.gainOverall } : null,
    },
    chartData: monthlyGraph,
    details: hStats
  });
});

// Socket.IO connections handler
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
  
  // Emit initial device & live sensor state immediately
  socket.emit('scale_status', liveScaleState);
  
  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Serve frontend assets in production
async function startFullStack() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Use httpServer instead of app.listen for Socket.IO compatibility
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Livestock weight system running on http://localhost:${PORT}`);
  });
}

startFullStack();
