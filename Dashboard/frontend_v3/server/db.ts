import fs from 'fs';
import path from 'path';

export interface Cow {
  id: string; // Internal UUID/identifier
  cowId: string; // Farmer label e.g., "COW-001"
  name: string;
  breed: string;
  gender: 'Female' | 'Male';
  birthDate: string;
  image?: string;
  createdAt: string;
}

export interface WeightRecord {
  id: string;
  cowId: string; // Identifies Cow (or "unidentified" if manual run)
  deviceId: string;
  weight: number; // Stable reading (display value)
  timestamp: string;
  stable: boolean;
}

export interface Device {
  deviceId: string;
  status: 'online' | 'offline';
  lastSeen: string;
  wifiSSID?: string;
  wifiIP?: string;
  wifiSignal?: number;
  wifiStatus?: 'connected' | 'disconnected' | 'connecting' | 'failed';
}

interface DBStructure {
  cows: Cow[];
  weightRecords: WeightRecord[];
  devices: Device[];
}

const DB_FILE = path.join(process.cwd(), 'db.json');

// Real-world sample data for cattle farm (Brahman, Angus, Holstein, Nellore)
const INITIAL_COWS: Cow[] = [
  {
    id: "1",
    cowId: "COW-001",
    name: "Bella",
    breed: "Brahman",
    gender: "Female",
    birthDate: "2022-04-12",
    createdAt: "2024-01-10T10:00:00Z",
    image: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=500&auto=format&fit=crop&q=60" // beautiful cow photo
  },
  {
    id: "2",
    cowId: "COW-002",
    name: "Duchess",
    breed: "Brahman",
    gender: "Female",
    birthDate: "2021-11-20",
    createdAt: "2024-01-11T11:00:00Z",
    image: "https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "3",
    cowId: "COW-003",
    name: "Rocky",
    breed: "Angus",
    gender: "Male",
    birthDate: "2023-01-15",
    createdAt: "2024-02-01T08:30:00Z",
    image: "https://images.unsplash.com/photo-1605001011156-cbf0b0f67a51?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "4",
    cowId: "COW-004",
    name: "Daisy",
    breed: "Holstein",
    gender: "Female",
    birthDate: "2023-06-05",
    createdAt: "2024-02-15T09:00:00Z",
    image: "https://images.unsplash.com/photo-1596733430284-f7437764b1a9?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "5",
    cowId: "COW-005",
    name: "Goliath",
    breed: "Charolais",
    gender: "Male",
    birthDate: "2022-08-30",
    createdAt: "2024-02-20T10:45:00Z",
    image: "https://images.unsplash.com/photo-1527153857715-3908f2bac5e8?w=500&auto=format&fit=crop&q=60"
  }
];

const INITIAL_DEVICES: Device[] = [
  { 
    deviceId: "esp32-scale-01", 
    status: "online", 
    lastSeen: new Date().toISOString(),
    wifiSSID: "AgroNet_Barn5",
    wifiIP: "192.168.1.145",
    wifiSignal: 82,
    wifiStatus: "connected"
  },
  { 
    deviceId: "esp32-scale-02", 
    status: "offline", 
    lastSeen: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    wifiSSID: undefined,
    wifiIP: undefined,
    wifiSignal: undefined,
    wifiStatus: "disconnected"
  }
];

// Seed weights simulating continuous growth over multiple months
const generateWeightRecords = (): WeightRecord[] => {
  const records: WeightRecord[] = [];
  const baseWeights: Record<string, number> = {
    "COW-001": 220, // Brahman Cow starts at 220kg in Jan, grows to 245kg
    "COW-002": 310, // Older Brahman starts at 310kg, grows to 335kg
    "COW-003": 190, // Angus Male starts at 190kg, grows to 250kg
    "COW-004": 205, // Holstein starts at 205kg, grows to 240kg
    "COW-005": 380  // Large Charolais starts at 380kg, grows to 440kg
  };

  const monthlyGrowth: Record<string, number> = {
    "COW-001": 4.1, // kg growth per month
    "COW-002": 3.8,
    "COW-003": 7.5, // Angus male grows fast
    "COW-004": 5.2,
    "COW-005": 9.0  // Large Charolais male grows fastest
  };

  // Generate records for last 6 months
  const now = new Date();
  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const recordDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 15, 8, 30);
    
    Object.keys(baseWeights).forEach(cowId => {
      const growthFactor = (5 - monthOffset); 
      // Add a little randomness
      const randomNoise = (Math.sin(monthOffset + cowId.charCodeAt(0)) * 2.5);
      const calculatedWeight = Math.round((baseWeights[cowId] + monthlyGrowth[cowId] * growthFactor + randomNoise) * 10) / 10;
      
      records.push({
        id: `rec-${cowId}-${monthOffset}`,
        cowId: cowId,
        deviceId: "esp32-scale-01",
        weight: calculatedWeight,
        timestamp: recordDate.toISOString(),
        stable: true
      });
    });
  }

  // Add one extremely fresh reading from today to play with the dashboard right away
  records.push({
    id: "rec-fresh-1",
    cowId: "COW-001",
    deviceId: "esp32-scale-01",
    weight: 245.0, // This is Bella's stable reading in the hardware prompt!
    timestamp: new Date().toISOString(),
    stable: true
  });

  return records;
};

class DBManager {
  private data: DBStructure;

  constructor() {
    this.data = { cows: [], weightRecords: [], devices: [] };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        // Make sure collections exist
        if (!this.data.cows) this.data.cows = [];
        if (!this.data.weightRecords) this.data.weightRecords = [];
        if (!this.data.devices) this.data.devices = [];
      } else {
        this.data = {
          cows: INITIAL_COWS,
          weightRecords: generateWeightRecords(),
          devices: INITIAL_DEVICES
        };
        this.save();
      }
    } catch (e) {
      console.error("Failed to load/parse database file:", e);
      this.data = {
        cows: INITIAL_COWS,
        weightRecords: generateWeightRecords(),
        devices: INITIAL_DEVICES
      };
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error("Failed to write to database file:", e);
    }
  }

  // COWS API helpers
  public getCows(): Cow[] {
    return this.data.cows;
  }

  public getCowById(cowId: string): Cow | undefined {
    return this.data.cows.find(c => c.cowId === cowId || c.id === cowId);
  }

  public addCow(cow: Omit<Cow, 'id' | 'createdAt'>): Cow {
    const id = String(Date.now());
    const newCow: Cow = {
      ...cow,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.cows.push(newCow);
    this.save();
    return newCow;
  }

  public updateCow(cowId: string, updatedFields: Partial<Cow>): Cow | undefined {
    const index = this.data.cows.findIndex(c => c.cowId === cowId || c.id === cowId);
    if (index !== -1) {
      this.data.cows[index] = { ...this.data.cows[index], ...updatedFields };
      this.save();
      return this.data.cows[index];
    }
    return undefined;
  }

  public deleteCow(cowId: string): boolean {
    const lengthBefore = this.data.cows.length;
    this.data.cows = this.data.cows.filter(c => c.cowId !== cowId && c.id !== cowId);
    // Also delete references in weight records if requested
    this.data.weightRecords = this.data.weightRecords.filter(r => r.cowId !== cowId);
    this.save();
    return this.data.cows.length < lengthBefore;
  }

  // WEIGHTS helpers
  public getWeightRecords(): WeightRecord[] {
    return this.data.weightRecords;
  }

  public getWeightRecordsByCow(cowId: string): WeightRecord[] {
    return this.data.weightRecords.filter(r => r.cowId === cowId);
  }

  public getWeightRecordsByDevice(deviceId: string): WeightRecord[] {
    return this.data.weightRecords.filter(r => r.deviceId === deviceId);
  }

  public addWeightRecord(record: Omit<WeightRecord, 'id' | 'timestamp'> & { timestamp?: string }): WeightRecord {
    const id = `rec-${Date.now()}`;
    const newRecord: WeightRecord = {
      ...record,
      id,
      timestamp: record.timestamp || new Date().toISOString()
    };
    this.data.weightRecords.push(newRecord);
    this.save();
    return newRecord;
  }

  public deleteWeightRecordsByDevice(deviceId: string): boolean {
    const beforeLength = this.data.weightRecords.length;
    this.data.weightRecords = this.data.weightRecords.filter(r => r.deviceId !== deviceId);
    this.save();
    return this.data.weightRecords.length < beforeLength;
  }

  // DEVICES helpers
  public getDevices(): Device[] {
    return this.data.devices;
  }

  public updateDeviceStatus(deviceId: string, status: 'online' | 'offline') {
    const index = this.data.devices.findIndex(d => d.deviceId === deviceId);
    if (index !== -1) {
      this.data.devices[index].status = status;
      this.data.devices[index].lastSeen = new Date().toISOString();
      if (status === 'offline') {
        this.data.devices[index].wifiStatus = 'disconnected';
      }
    } else {
      this.data.devices.push({
        deviceId,
        status,
        lastSeen: new Date().toISOString(),
        wifiStatus: status === 'online' ? 'connected' : 'disconnected'
      });
    }
    this.save();
  }

  public updateDeviceWifi(deviceId: string, wifiData: { ssid?: string; ip?: string; signal?: number; status: 'connected' | 'disconnected' | 'connecting' | 'failed' }) {
    const index = this.data.devices.findIndex(d => d.deviceId === deviceId);
    if (index !== -1) {
      this.data.devices[index].wifiSSID = wifiData.ssid;
      this.data.devices[index].wifiIP = wifiData.ip;
      this.data.devices[index].wifiSignal = wifiData.signal;
      this.data.devices[index].wifiStatus = wifiData.status;
      if (wifiData.status === 'connected') {
        this.data.devices[index].status = 'online';
      } else if (wifiData.status === 'failed' || wifiData.status === 'disconnected') {
        this.data.devices[index].status = 'offline';
      }
      this.data.devices[index].lastSeen = new Date().toISOString();
    } else {
      this.data.devices.push({
        deviceId,
        status: wifiData.status === 'connected' ? 'online' : 'offline',
        lastSeen: new Date().toISOString(),
        wifiSSID: wifiData.ssid,
        wifiIP: wifiData.ip,
        wifiSignal: wifiData.signal,
        wifiStatus: wifiData.status
      });
    }
    this.save();
  }
}

export const db = new DBManager();
