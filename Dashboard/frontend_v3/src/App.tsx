import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useTranslation } from 'react-i18next';

// i18n initialization
import './i18n.js';

// Top elements
import Layout from './components/Layout';

// View elements
import DashboardView from './components/views/DashboardView';
import LiveScaleView from './components/views/LiveScaleView';
import CattleRecordsView from './components/views/CattleRecordsView';
import CowDetailView from './components/views/CowDetailView';
import WeightHistoryView from './components/views/WeightHistoryView';
import ReportsView from './components/views/ReportsView';
import AnalyticsView from './components/views/AnalyticsView';
import SettingsView from './components/views/SettingsView';

import { 
  Cow, 
  WeightRecord, 
  Device, 
  DashboardStats, 
  LiveScaleState, 
  ReportData 
} from './types';

export default function App() {
  const { t } = useTranslation();
  
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedCowId, setSelectedCowId] = useState<string>('');
  const [cows, setCows] = useState<Cow[]>([]);
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [liveScale, setLiveScale] = useState<LiveScaleState>({ deviceId: 'SCALE-01', weight: 0, stable: false, timestamp: new Date().toISOString() });
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [backendUrl] = useState<string>(window.location.origin);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [appTheme, setAppTheme] = useState<'light' | 'dark' | 'farm'>('farm');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') as any;
    setAppTheme(savedTheme || 'light');
    document.documentElement.setAttribute('data-theme', savedTheme || 'light');
  }, []);

  const handleChangeTheme = (newTheme: any) => {
    setAppTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('app_theme', newTheme);
  };

  const triggerMasterDataGrab = async () => {
    try {
      const statsRes = await axios.get(`/api/dashboard/stats`);
      setDashboardStats(statsRes.data);
      
      const cowRes = await axios.get(`/api/cows`);
      setCows(cowRes.data);

      const deviceRes = await axios.get(`/api/devices`);
      setDevices(deviceRes.data);

      const weightsRes = await axios.get(`/api/weights`); 
      const allWeights = weightsRes.data;
      setWeights(allWeights);

      // Generate basic report data from weights
      if (allWeights.length > 0) {
        const reportDetails = cowRes.data.map((cow: Cow) => {
          const cowWeights = allWeights.filter((w: WeightRecord) => w.cowId === cow.cowId);
          const current = cowWeights[0]?.weight || 0;
          const prev = cowWeights[1]?.weight || 0;
          return {
            cowId: cow.cowId,
            name: cow.name,
            breed: cow.breed,
            currentWeight: current,
            previousWeight: prev,
            gainFromPrev: current - prev,
            gainOverall: cowWeights.length > 0 ? current - cowWeights[cowWeights.length-1].weight : 0,
            adg: 0,
            lastWeighed: cowWeights[0]?.timestamp || '',
            recordsCount: cowWeights.length
          };
        });
        setReportData({
          summary: { 
            averageWeight: statsRes.data.averageWeight, 
            cowsGainedRate: 0, 
            cowsLostRate: 0, 
            mostImproved: { cowId: '', name: '', gain: 0 }, 
            leastImproved: { cowId: '', name: '', gain: 0 } 
          },
          chartData: [],
          details: reportDetails
        });
      }

    } catch (e) {
      console.error("Backend fetch failed. Ensure server is running on port 3002", e);
    }
  };

  useEffect(() => {
    triggerMasterDataGrab();
  }, [backendUrl]);

  useEffect(() => {
    const socket: Socket = io(backendUrl, {
      transports: ['websocket'],
    });

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('weight_update', (data: any) => {
      setLiveScale({
        deviceId: data.deviceId,
        weight: data.display || data.weight,
        stable: data.stable,
        timestamp: data.timestamp
      });
    });

    socket.on('db_changed', () => triggerMasterDataGrab());

    return () => { socket.disconnect(); };
  }, [backendUrl]);

  const handleNavigateToCowProfile = (cowId: string) => {
    setSelectedCowId(cowId);
    setCurrentTab('cow-detail');
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView stats={dashboardStats} liveWeight={liveScale} onNavigateToTab={setCurrentTab} onSelectCow={handleNavigateToCowProfile} />;
      case 'livescale':
        return (
          <LiveScaleView 
            liveScale={liveScale} 
            cows={cows} 
            devices={devices} 
            onSaveWeight={async (cowId, weight, deviceId) => {
              try {
                await axios.post(`/api/cows/${cowId}/weights`, { weight, deviceId });
                triggerMasterDataGrab(); // Refresh stats/history
                return true;
              } catch (e) {
                console.error("Save failed", e);
                return false;
              }
            }} 
          />
        );
      case 'cows':
        return (
          <CattleRecordsView 
            cows={cows} 
            weights={weights} 
            onAddCow={async (cow) => {
              try {
                await axios.post(`/api/cows`, cow);
                triggerMasterDataGrab();
                return true;
              } catch (e) { return false; }
            }} 
            onEditCow={async (id, data) => {
              try {
                await axios.patch(`/api/cows/${id}`, data);
                triggerMasterDataGrab();
                return true;
              } catch (e) { return false; }
            }} 
            onDeleteCow={async (id) => {
              try {
                await axios.delete(`/api/cows/${id}`);
                triggerMasterDataGrab();
                return true;
              } catch (e) { return false; }
            }} 
            onSelectCow={handleNavigateToCowProfile} 
          />
        );
      case 'cow-detail':
        return <CowDetailView cowId={selectedCowId} cows={cows} weights={weights} onBack={() => setCurrentTab('cows')} />;
      case 'history':
        return <WeightHistoryView weights={weights} cows={cows} />;
      case 'reports':
        return <ReportsView reportType={reportType} onSetReportType={setReportType} reportData={reportData} />;
      case 'analytics':
        return <AnalyticsView cows={cows} weights={weights} onSelectCow={handleNavigateToCowProfile} />;
      case 'settings':
        return <SettingsView devices={devices} onClearDeviceData={() => Promise.resolve(true)} theme={appTheme} onChangeTheme={handleChangeTheme} />;
      default:
        return <p>Page not found</p>;
    }
  };

  return (
    <Layout
      currentTab={currentTab}
      onSetTab={setCurrentTab}
      socketConnected={socketConnected}
      alertCount={dashboardStats ? dashboardStats.alerts.length : 0}
    >
      {renderTabContent()}
    </Layout>
  );
}
