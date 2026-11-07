/**
 * Smart Traffic Light Simulation - Main Application Entrypoint
 * Full-stack AI-Powered Intelligent Traffic Management System
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { SimulationView } from './components/simulation/SimulationView';
import { DetectionView } from './components/detection/DetectionView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ComparisonView } from './components/comparison/ComparisonView';
import { HistoryView } from './components/history/HistoryView';
import { SettingsView } from './components/settings/SettingsView';
import { AboutView } from './components/about/AboutView';

import {
  TrafficSimulationEngine,
} from './engine/TrafficSimulationEngine';
import { ComputerVisionDetector } from './engine/ComputerVisionDetector';
import {
  SystemSettings,
  TrafficScenario,
  ControllerType,
  Direction,
  VehicleType,
  SimulationMetrics,
  DirectionTrafficState,
  SignalState,
} from './types/traffic';
import {
  getStoredSettings,
  saveStoredSettings,
  saveSessionToHistory,
} from './services/storage';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [settings, setSettings] = useState<SystemSettings>(() => getStoredSettings());
  const [scenario, setScenario] = useState<TrafficScenario>('balanced');
  const [controllerType, setControllerType] = useState<ControllerType>('adaptive');
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  // Engines
  const engineRef = useRef<TrafficSimulationEngine | null>(null);
  const detectorRef = useRef<ComputerVisionDetector | null>(null);

  if (!engineRef.current) {
    engineRef.current = new TrafficSimulationEngine(settings);
  }
  if (!detectorRef.current) {
    detectorRef.current = new ComputerVisionDetector(settings.confidenceThreshold);
  }

  // React State for visual updates
  const [vehicles, setVehicles] = useState(engineRef.current.getVehicles());
  const [signals, setSignals] = useState<Record<Direction, SignalState>>(
    engineRef.current.getSignals()
  );
  const [controllerState, setControllerState] = useState(
    engineRef.current.getActiveControllerState()
  );
  const [directionStates, setDirectionStates] = useState<Record<Direction, DirectionTrafficState>>(
    engineRef.current.getDirectionTrafficStates()
  );
  const [metrics, setMetrics] = useState<SimulationMetrics>(
    engineRef.current.getMetrics()
  );
  const [densityHistory, setDensityHistory] = useState<
    Array<{ time: string; north: number; south: number; east: number; west: number; avgWait: number }>
  >([]);

  // Simulation Tick Loop with requestAnimationFrame
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let historyTickTimer = 0;

    const loop = (currentTime: number) => {
      const deltaMs = currentTime - lastTime;
      lastTime = currentTime;
      const dt = Math.min(0.1, deltaMs / 1000); // clamp max dt to prevent spiral

      const engine = engineRef.current;
      if (engine && engine.getIsRunning()) {
        engine.tick(dt);

        setVehicles([...engine.getVehicles()]);
        setSignals({ ...engine.getSignals() });
        setControllerState({ ...engine.getActiveControllerState() });
        const dirStates = engine.getDirectionTrafficStates();
        setDirectionStates({ ...dirStates });
        const curMetrics = engine.getMetrics();
        setMetrics({ ...curMetrics });

        // Update density history every 1.5 seconds
        historyTickTimer += dt;
        if (historyTickTimer >= 1.5) {
          historyTickTimer = 0;
          const timeStr = new Date().toTimeString().slice(3, 8);
          setDensityHistory((prev) => {
            const entry = {
              time: timeStr,
              north: dirStates.north.density,
              south: dirStates.south.density,
              east: dirStates.east.density,
              west: dirStates.west.density,
              avgWait: curMetrics.averageWaitingTime,
            };
            const updated = [...prev, entry];
            return updated.length > 25 ? updated.slice(updated.length - 25) : updated;
          });
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Handle Controller and Scenario changes
  const handleChangeControllerType = (type: ControllerType) => {
    setControllerType(type);
    engineRef.current?.setControllerType(type);
  };

  const handleSelectScenario = (sc: TrafficScenario) => {
    setScenario(sc);
    engineRef.current?.setScenario(sc);
  };

  const handleChangeArrivalRate = (rate: number) => {
    const updated = { ...settings, vehicleArrivalRate: rate };
    setSettings(updated);
    saveStoredSettings(updated);
    engineRef.current?.updateSettings(updated);
  };

  const handleChangeSpeed = (spd: number) => {
    setSimSpeed(spd);
    const updated = { ...settings, simulationSpeed: spd };
    setSettings(updated);
    engineRef.current?.updateSettings(updated);
  };

  const handleTogglePlay = () => {
    if (engineRef.current) {
      const active = engineRef.current.togglePlay();
      setIsRunning(active);
    }
  };

  const handleReset = () => {
    if (engineRef.current) {
      // Archive current session to history before reset if it had vehicles
      const curMetrics = engineRef.current.getMetrics();
      if (curMetrics.totalProcessed > 5) {
        saveSessionToHistory({
          id: `sess-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          scenario,
          controllerType,
          durationSeconds: curMetrics.elapsedTime,
          totalVehicles: curMetrics.totalProcessed,
          avgWaitingTime: curMetrics.averageWaitingTime,
          throughput: curMetrics.throughputPerMinute,
          avgQueueLength: curMetrics.averageQueueLength,
          efficiencyScore: Math.round(
            Math.max(50, Math.min(99, 100 - curMetrics.averageWaitingTime * 1.5))
          ),
        });
      }

      engineRef.current.reset();
      setVehicles([]);
      setSignals(engineRef.current.getSignals());
      setControllerState(engineRef.current.getActiveControllerState());
      setDirectionStates(engineRef.current.getDirectionTrafficStates());
      setMetrics(engineRef.current.getMetrics());
    }
  };

  const handleSpawnVehicle = (dir: Direction, type?: VehicleType) => {
    engineRef.current?.spawnVehicleManual(dir, type);
  };

  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    engineRef.current?.updateSettings(newSettings);
    detectorRef.current?.setConfidenceThreshold(newSettings.confidenceThreshold);
  };

  const getPageInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Executive Traffic Management Dashboard',
          subtitle: 'Live intersection telemetry, dynamic priority state, and congestion indicators',
        };
      case 'simulation':
        return {
          title: 'Live 4-Way Intersection Simulation',
          subtitle: 'Microscopic vehicle physics, deceleration, stop line obedience, and active phase control',
        };
      case 'detection':
        return {
          title: 'Computer Vision Vehicle Detection & Tracking',
          subtitle: 'Real-time YOLO inference, Centroid/SORT tracking, and directional counting lines',
        };
      case 'analytics':
        return {
          title: 'Traffic Analytics & Performance Telemetry',
          subtitle: 'Directional volume, classification charts, delay trends, and CSV data export',
        };
      case 'comparison':
        return {
          title: 'Algorithm Comparison & Benchmarking',
          subtitle: 'Head-to-head empirical comparison: Traditional Fixed-Time vs. AI-Adaptive Optimization',
        };
      case 'history':
        return {
          title: 'Simulation Audit Log & Archival',
          subtitle: 'Historical session audit trails, efficiency scores, and JSON export',
        };
      case 'settings':
        return {
          title: 'Algorithm & Signal Timing Configuration',
          subtitle: 'Priority formulation weights, green limits, and safety clearance interlocks',
        };
      case 'about':
        return {
          title: 'System Architecture & Documentation',
          subtitle: 'Mathematical formulations, finite state machine proofs, and Python backend setup guide',
        };
    }
  };

  const pageInfo = getPageInfo();
  const hasEmergency =
    directionStates.north.hasEmergency ||
    directionStates.south.hasEmergency ||
    directionStates.east.hasEmergency ||
    directionStates.west.hasEmergency;

  return (
    <div className="flex h-screen bg-zinc-50 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Persistent Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        systemActive={isRunning}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          isRunning={isRunning}
          onTogglePlay={handleTogglePlay}
          onReset={handleReset}
          simSpeed={simSpeed}
          onChangeSpeed={handleChangeSpeed}
          controllerType={controllerType}
          onChangeControllerType={handleChangeControllerType}
          hasEmergency={hasEmergency}
        />

        {/* View Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6">
          {currentTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              directionStates={directionStates}
              controllerState={controllerState}
              controllerType={controllerType}
              densityHistory={densityHistory}
              onNavigateToSim={() => setCurrentTab('simulation')}
              onNavigateToDetection={() => setCurrentTab('detection')}
            />
          )}

          {currentTab === 'simulation' && (
            <SimulationView
              vehicles={vehicles}
              signals={signals}
              controllerState={controllerState}
              directionStates={directionStates}
              metrics={metrics}
              scenario={scenario}
              onSelectScenario={handleSelectScenario}
              controllerType={controllerType}
              onChangeControllerType={handleChangeControllerType}
              arrivalRate={settings.vehicleArrivalRate}
              onChangeArrivalRate={handleChangeArrivalRate}
              isRunning={isRunning}
              onTogglePlay={handleTogglePlay}
              onReset={handleReset}
              onSpawnVehicle={handleSpawnVehicle}
            />
          )}

          {currentTab === 'detection' && detectorRef.current && (
            <DetectionView detector={detectorRef.current} />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              metrics={metrics}
              directionStates={directionStates}
              densityHistory={densityHistory}
            />
          )}

          {currentTab === 'comparison' && <ComparisonView />}

          {currentTab === 'history' && <HistoryView />}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
            />
          )}

          {currentTab === 'about' && <AboutView />}
        </main>
      </div>
    </div>
  );
}
