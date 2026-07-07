export interface Cow {
  cowId: string; // The primary key (Tag ID)
  name: string;
  breed: string;
  gender: 'Female' | 'Male';
  birthDate: string;
  image?: string;
  createdAt: string;
}

export interface WeightRecord {
  id: string;
  cowId: string;
  deviceId: string;
  weight: number;
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

export interface Alert {
  id: string;
  type: 'weight_loss' | 'not_weighed' | 'device_offline' | 'abnormal_reading' | 'unstable_readings';
  severity: 'high' | 'medium' | 'low';
  cowId?: string;
  cowName?: string;
  message: string;
  timestamp: string;
}

export interface RecentActivity {
  id: string;
  type: string;
  cowId: string;
  cowName: string;
  breed: string;
  weight: number;
  timestamp: string;
  deviceId: string;
  logo: string | null;
}

export interface LiveScaleState {
  deviceId: string;
  weight: number;
  stable: boolean;
  timestamp: string;
}

export interface DashboardStats {
  totalCows: number;
  averageWeight: number;
  heaviestCow: (Cow & { weight: number }) | null;
  lightestCow: (Cow & { weight: number }) | null;
  todayMeasurementsCount: number;
  weeklyMeasurementsCount: number;
  onlineDevices: number;
  alerts: Alert[];
  recentActivity: RecentActivity[];
  liveScale: LiveScaleState;
}

export interface ReportSummary {
  averageWeight: number;
  cowsGainedRate: number;
  cowsLostRate: number;
  mostImproved: { cowId: string; name: string; gain: number } | null;
  leastImproved: { cowId: string; name: string; gain: number } | null;
}

export interface ReportChartPoint {
  label: string;
  avgWeight: number;
  count: number;
}

export interface CowGrowthStat {
  cowId: string;
  name: string;
  breed: string;
  currentWeight: number;
  previousWeight: number | null;
  gainFromPrev: number;
  gainOverall: number;
  adg: number;
  lastWeighed: string;
  recordsCount: number;
}

export interface ReportData {
  summary: ReportSummary;
  chartData: ReportChartPoint[];
  details: CowGrowthStat[];
}
