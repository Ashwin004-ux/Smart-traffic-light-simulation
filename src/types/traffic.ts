/**
 * Smart Traffic Light Simulation - Types & Interfaces
 */

export type Direction = 'north' | 'south' | 'east' | 'west';

export type SignalState = 'RED' | 'YELLOW' | 'GREEN' | 'ALL_RED';

export type VehicleType = 'car' | 'motorcycle' | 'bus' | 'truck' | 'emergency';

export type ControllerType = 'adaptive' | 'fixed';

export type TrafficScenario =
  | 'balanced'
  | 'heavy_north_south'
  | 'heavy_east_west'
  | 'rush_hour'
  | 'random'
  | 'emergency';

export interface Vehicle {
  id: string;
  type: VehicleType;
  direction: Direction;
  lane: number; // 0: inner/turn, 1: straight/outer
  position: number; // distance from start of road towards intersection (pixels)
  speed: number; // current pixels per second
  targetSpeed: number; // maximum desired speed
  length: number; // vehicle length in pixels
  width: number;
  color: string;
  entryTime: number; // timestamp when spawned
  waitingTime: number; // accumulated time spent waiting at red or behind other stopped vehicles (seconds)
  isWaiting: boolean;
  hasCrossed: boolean;
  exitTime?: number;
}

export interface DirectionTrafficState {
  direction: Direction;
  vehicleCount: number;
  queueLength: number;
  density: number; // percentage 0-100%
  averageWaitingTime: number; // seconds
  priorityScore: number;
  currentSignal: SignalState;
  hasEmergency: boolean;
}

export interface TrafficSignalPhase {
  id: 'NORTH_SOUTH' | 'EAST_WEST';
  directions: Direction[];
  name: string;
}

export interface SystemSettings {
  // Algorithm Weights
  weightVehicleCount: number; // default 0.45
  weightQueueLength: number; // default 0.30
  weightWaitingTime: number; // default 0.25

  // Signal Timings (seconds)
  minGreenDuration: number; // default 10
  maxGreenDuration: number; // default 60
  yellowDuration: number; // default 3
  allRedDuration: number; // default 2
  fixedGreenDuration: number; // default 30 (for fixed-time controller)

  // Simulation Parameters
  vehicleArrivalRate: number; // vehicles per minute (e.g. 24)
  simulationSpeed: number; // multiplier (1, 2, 4)
  emergencyVehiclePriority: boolean; // default true
  confidenceThreshold: number; // default 0.50
}

export interface SimulationMetrics {
  totalProcessed: number;
  totalWaitingVehicles: number;
  averageWaitingTime: number;
  maxWaitingTime: number;
  averageQueueLength: number;
  throughputPerMinute: number;
  clearanceTime: number;
  congestionIndex: 'low' | 'moderate' | 'heavy' | 'severe';
  elapsedTime: number;
}

export interface DetectedVehicle {
  trackId: number;
  type: VehicleType;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  direction: Direction;
  speedKmH: number;
  firstSeen: number;
  lastSeen: number;
  counted: boolean;
}

export interface DetectionStats {
  fps: number;
  latencyMs: number;
  totalDetections: number;
  activeTracks: number;
  countByDirection: Record<Direction, number>;
  countByType: Record<VehicleType, number>;
}

export interface SimulationSessionRecord {
  id: string;
  timestamp: string;
  scenario: TrafficScenario;
  controllerType: ControllerType;
  durationSeconds: number;
  totalVehicles: number;
  avgWaitingTime: number;
  throughput: number;
  avgQueueLength: number;
  efficiencyScore: number;
}

export interface ComparisonResult {
  scenario: TrafficScenario;
  durationSeconds: number;
  fixed: {
    avgWaitingTime: number;
    avgQueueLength: number;
    throughput: number;
    clearanceTime: number;
    congestionDuration: number;
  };
  adaptive: {
    avgWaitingTime: number;
    avgQueueLength: number;
    throughput: number;
    clearanceTime: number;
    congestionDuration: number;
  };
  improvement: {
    waitingTimePercent: number;
    queueLengthPercent: number;
    throughputPercent: number;
    clearancePercent: number;
    congestionPercent: number;
  };
}
