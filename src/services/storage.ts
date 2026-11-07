/**
 * Storage Service for System Settings, History, and Event Logs
 */

import { SystemSettings, SimulationSessionRecord } from '../types/traffic';

export const DEFAULT_SETTINGS: SystemSettings = {
  weightVehicleCount: 0.45,
  weightQueueLength: 0.30,
  weightWaitingTime: 0.25,

  minGreenDuration: 10,
  maxGreenDuration: 60,
  yellowDuration: 3,
  allRedDuration: 2,
  fixedGreenDuration: 30,

  vehicleArrivalRate: 30,
  simulationSpeed: 1,
  emergencyVehiclePriority: true,
  confidenceThreshold: 0.50,
};

const SETTINGS_KEY = 'smart_traffic_settings_v1';
const HISTORY_KEY = 'smart_traffic_history_v1';

export function getStoredSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to read settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings: SystemSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function getStoredHistory(): SimulationSessionRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to read history from localStorage', e);
  }

  // Pre-seed realistic historical sessions for demonstration
  const seededHistory: SimulationSessionRecord[] = [
    {
      id: 'sess-001',
      timestamp: '2026-11-06 17:30:00',
      scenario: 'rush_hour',
      controllerType: 'adaptive',
      durationSeconds: 900,
      totalVehicles: 384,
      avgWaitingTime: 14.8,
      throughput: 25.6,
      avgQueueLength: 4.2,
      efficiencyScore: 92.4,
    },
    {
      id: 'sess-002',
      timestamp: '2026-11-06 17:15:00',
      scenario: 'rush_hour',
      controllerType: 'fixed',
      durationSeconds: 900,
      totalVehicles: 295,
      avgWaitingTime: 28.6,
      throughput: 19.6,
      avgQueueLength: 8.9,
      efficiencyScore: 64.1,
    },
    {
      id: 'sess-003',
      timestamp: '2026-11-06 14:00:00',
      scenario: 'heavy_north_south',
      controllerType: 'adaptive',
      durationSeconds: 600,
      totalVehicles: 240,
      avgWaitingTime: 12.1,
      throughput: 24.0,
      avgQueueLength: 3.5,
      efficiencyScore: 94.8,
    },
    {
      id: 'sess-004',
      timestamp: '2026-11-06 13:45:00',
      scenario: 'heavy_north_south',
      controllerType: 'fixed',
      durationSeconds: 600,
      totalVehicles: 182,
      avgWaitingTime: 26.4,
      throughput: 18.2,
      avgQueueLength: 7.8,
      efficiencyScore: 68.3,
    },
    {
      id: 'sess-005',
      timestamp: '2026-11-06 11:20:00',
      scenario: 'emergency',
      controllerType: 'adaptive',
      durationSeconds: 450,
      totalVehicles: 165,
      avgWaitingTime: 11.2,
      throughput: 22.0,
      avgQueueLength: 2.8,
      efficiencyScore: 96.5,
    },
  ];

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(seededHistory));
  } catch {}
  return seededHistory;
}

export function saveSessionToHistory(record: SimulationSessionRecord): void {
  try {
    const list = getStoredHistory();
    const updated = [record, ...list].slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save session history', e);
  }
}

export function clearStoredHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error('Failed to clear history', e);
  }
}
