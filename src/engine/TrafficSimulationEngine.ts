/**
 * High-Fidelity 4-Way Intersection Traffic Simulation Engine
 * Simulates vehicle generation, kinematic car-following physics, signal compliance,
 * queue accumulation, collision prevention, and performance metrics.
 */

import {
  Direction,
  SignalState,
  Vehicle,
  VehicleType,
  SystemSettings,
  TrafficScenario,
  DirectionTrafficState,
  SimulationMetrics,
  ControllerType,
} from '../types/traffic';
import { AdaptiveSignalController } from './AdaptiveSignalController';
import { FixedSignalController } from './FixedSignalController';

// Geometric Constants for 600x600 coordinate system
export const INTERSECTION_GEOMETRY = {
  CANVAS_SIZE: 600,
  CENTER: 300,
  ROAD_WIDTH: 120, // 60px per direction (2 lanes each 30px)
  LANE_WIDTH: 30,
  STOP_LINE_OFFSET: 65, // Distance from center to stop line (300 - 65 = 235px)
  INTERSECTION_BOX: 130, // 130x130 box in center
  ROAD_LENGTH: 300, // Distance from edge of canvas to center
};

export class TrafficSimulationEngine {
  private vehicles: Vehicle[] = [];
  private settings: SystemSettings;
  private scenario: TrafficScenario = 'balanced';
  private controllerType: ControllerType = 'adaptive';
  private adaptiveController: AdaptiveSignalController;
  private fixedController: FixedSignalController;

  private isRunning: boolean = true;
  private elapsedTime: number = 0; // seconds
  private lastVehicleSpawnTimes: Record<Direction, number> = {
    north: 0,
    south: 0,
    east: 0,
    west: 0,
  };

  // Metrics
  private totalGeneratedCount: number = 0;
  private totalProcessedCount: number = 0;
  private completedWaitingTimes: number[] = [];
  private nextVehicleId: number = 1001;

  constructor(settings: SystemSettings) {
    this.settings = settings;
    this.adaptiveController = new AdaptiveSignalController(settings);
    this.fixedController = new FixedSignalController(settings);
  }

  public updateSettings(settings: SystemSettings) {
    this.settings = settings;
    this.adaptiveController.updateSettings(settings);
    this.fixedController.updateSettings(settings);
  }

  public setScenario(scenario: TrafficScenario) {
    this.scenario = scenario;
  }

  public setControllerType(type: ControllerType) {
    this.controllerType = type;
  }

  public getControllerType(): ControllerType {
    return this.controllerType;
  }

  public start() {
    this.isRunning = true;
  }

  public pause() {
    this.isRunning = false;
  }

  public togglePlay(): boolean {
    this.isRunning = !this.isRunning;
    return this.isRunning;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public reset() {
    this.vehicles = [];
    this.elapsedTime = 0;
    this.totalGeneratedCount = 0;
    this.totalProcessedCount = 0;
    this.completedWaitingTimes = [];
    this.lastVehicleSpawnTimes = { north: 0, south: 0, east: 0, west: 0 };
    this.adaptiveController.reset();
    this.fixedController.reset();
  }

  public getVehicles(): Vehicle[] {
    return this.vehicles;
  }

  public getSignals(): Record<Direction, SignalState> {
    return this.controllerType === 'adaptive'
      ? this.adaptiveController.getSignals()
      : this.fixedController.getSignals();
  }

  public getActiveControllerState() {
    return this.controllerType === 'adaptive'
      ? this.adaptiveController.getState()
      : this.fixedController.getState();
  }

  public getAdaptiveController(): AdaptiveSignalController {
    return this.adaptiveController;
  }

  /**
   * Spawns a vehicle manually (useful for user testing, emergency test)
   */
  public spawnVehicleManual(direction: Direction, type: VehicleType = 'car'): Vehicle | null {
    return this.spawnVehicle(direction, type);
  }

  private spawnVehicle(direction: Direction, forcedType?: VehicleType): Vehicle | null {
    // Check if there is already a vehicle too close to spawn point (position < 45)
    const tooClose = this.vehicles.some(
      (v) => v.direction === direction && v.position < 45
    );
    if (tooClose) {
      return null;
    }

    const lane = Math.random() > 0.4 ? 1 : 0; // 0: inner, 1: outer
    let type: VehicleType = forcedType || 'car';

    if (!forcedType) {
      const rand = Math.random();
      if (rand < 0.65) type = 'car';
      else if (rand < 0.80) type = 'motorcycle';
      else if (rand < 0.90) type = 'truck';
      else if (rand < 0.97) type = 'bus';
      else type = 'emergency';
    }

    let length = 32;
    let width = 16;
    let targetSpeed = 85; // px/sec
    let color = '#3b82f6'; // default blue

    if (type === 'motorcycle') {
      length = 20;
      width = 10;
      targetSpeed = 95;
      color = '#10b981'; // green
    } else if (type === 'truck') {
      length = 50;
      width = 20;
      targetSpeed = 70;
      color = '#f59e0b'; // amber
    } else if (type === 'bus') {
      length = 56;
      width = 20;
      targetSpeed = 65;
      color = '#6366f1'; // indigo
    } else if (type === 'emergency') {
      length = 38;
      width = 18;
      targetSpeed = 110;
      color = '#ef4444'; // red
    } else {
      // Car variants
      const carColors = ['#2563eb', '#475569', '#0284c7', '#dc2626', '#4b5563', '#0d9488'];
      color = carColors[Math.floor(Math.random() * carColors.length)];
    }

    const vehicle: Vehicle = {
      id: `v-${this.nextVehicleId++}`,
      type,
      direction,
      lane,
      position: 0,
      speed: targetSpeed * 0.8,
      targetSpeed,
      length,
      width,
      color,
      entryTime: this.elapsedTime,
      waitingTime: 0,
      isWaiting: false,
      hasCrossed: false,
    };

    this.vehicles.push(vehicle);
    this.totalGeneratedCount++;
    return vehicle;
  }

  /**
   * Determine spawn probability by direction according to selected scenario
   */
  private checkSpawns(dt: number) {
    const baseRatePerMin = this.settings.vehicleArrivalRate; // e.g. 30 veh/min = 0.5 veh/sec total
    const totalRatePerSec = baseRatePerMin / 60;

    let weights: Record<Direction, number> = {
      north: 0.25,
      south: 0.25,
      east: 0.25,
      west: 0.25,
    };

    if (this.scenario === 'heavy_north_south') {
      weights = { north: 0.42, south: 0.42, east: 0.08, west: 0.08 };
    } else if (this.scenario === 'heavy_east_west') {
      weights = { north: 0.08, south: 0.08, east: 0.42, west: 0.42 };
    } else if (this.scenario === 'rush_hour') {
      weights = { north: 0.35, south: 0.35, east: 0.15, west: 0.15 };
    } else if (this.scenario === 'emergency') {
      weights = { north: 0.25, south: 0.25, east: 0.25, west: 0.25 };
      // Occasionally force an emergency vehicle
      if (Math.random() < 0.015 * dt * 60) {
        const dirs: Direction[] = ['north', 'south', 'east', 'west'];
        const randomDir = dirs[Math.floor(Math.random() * dirs.length)];
        this.spawnVehicle(randomDir, 'emergency');
      }
    }

    const directions: Direction[] = ['north', 'south', 'east', 'west'];
    for (const dir of directions) {
      const dirRate = totalRatePerSec * weights[dir];
      // Poisson probability for interval dt: P ~ lambda * dt
      if (Math.random() < dirRate * dt) {
        this.spawnVehicle(dir);
      }
    }
  }

  /**
   * Compute traffic state for each direction for controller analysis
   */
  public getDirectionTrafficStates(): Record<Direction, DirectionTrafficState> {
    const signals = this.getSignals();
    const result: Record<Direction, DirectionTrafficState> = {
      north: {
        direction: 'north',
        vehicleCount: 0,
        queueLength: 0,
        density: 0,
        averageWaitingTime: 0,
        priorityScore: 0,
        currentSignal: signals.north,
        hasEmergency: false,
      },
      south: {
        direction: 'south',
        vehicleCount: 0,
        queueLength: 0,
        density: 0,
        averageWaitingTime: 0,
        priorityScore: 0,
        currentSignal: signals.south,
        hasEmergency: false,
      },
      east: {
        direction: 'east',
        vehicleCount: 0,
        queueLength: 0,
        density: 0,
        averageWaitingTime: 0,
        priorityScore: 0,
        currentSignal: signals.east,
        hasEmergency: false,
      },
      west: {
        direction: 'west',
        vehicleCount: 0,
        queueLength: 0,
        density: 0,
        averageWaitingTime: 0,
        priorityScore: 0,
        currentSignal: signals.west,
        hasEmergency: false,
      },
    };

    const stopLinePos = INTERSECTION_GEOMETRY.ROAD_LENGTH - INTERSECTION_GEOMETRY.STOP_LINE_OFFSET; // ~235px

    for (const v of this.vehicles) {
      if (v.hasCrossed) continue; // Only count incoming approaches
      const state = result[v.direction];
      state.vehicleCount += 1;
      if (v.isWaiting || (v.position < stopLinePos && v.speed < 15)) {
        state.queueLength += 1;
      }
      if (v.type === 'emergency') {
        state.hasEmergency = true;
      }
      state.averageWaitingTime += v.waitingTime;
    }

    // Averages and density
    const directions: Direction[] = ['north', 'south', 'east', 'west'];
    for (const dir of directions) {
      const s = result[dir];
      if (s.vehicleCount > 0) {
        s.averageWaitingTime = Math.round((s.averageWaitingTime / s.vehicleCount) * 10) / 10;
      }
      // Density: max road capacity is roughly 16 vehicles (2 lanes * 8 vehicles)
      s.density = Math.min(100, Math.round((s.vehicleCount / 14) * 100));
    }

    return result;
  }

  /**
   * Main simulation tick (called 60 times/sec from animation frame or backend loop)
   */
  public tick(dtReal: number) {
    if (!this.isRunning) return;

    // Scale by simulation speed
    const dt = dtReal * (this.settings.simulationSpeed || 1);
    this.elapsedTime += dt;

    // 1. Spawning vehicles
    this.checkSpawns(dt);

    // 2. Compute traffic states
    const trafficStates = this.getDirectionTrafficStates();

    // 3. Advance controllers
    if (this.controllerType === 'adaptive') {
      this.adaptiveController.tick(dt, trafficStates);
    } else {
      this.fixedController.tick(dt);
    }

    const currentSignals = this.getSignals();
    const stopLinePos = INTERSECTION_GEOMETRY.ROAD_LENGTH - INTERSECTION_GEOMETRY.STOP_LINE_OFFSET; // 235px
    const roadEnd = INTERSECTION_GEOMETRY.CANVAS_SIZE; // 600px

    // 4. Update each vehicle physics (kinematics + collision avoidance + traffic light compliance)
    const sortedVehicles = [...this.vehicles].sort((a, b) => b.position - a.position);

    for (let i = 0; i < sortedVehicles.length; i++) {
      const v = sortedVehicles[i];
      const signal = currentSignals[v.direction];

      // Mark crossed
      if (!v.hasCrossed && v.position >= stopLinePos + 10) {
        v.hasCrossed = true;
      }

      // Find vehicle immediately ahead in the same direction and lane
      let vehicleAhead: Vehicle | null = null;
      for (let j = 0; j < sortedVehicles.length; j++) {
        if (i === j) continue;
        const other = sortedVehicles[j];
        if (
          other.direction === v.direction &&
          other.lane === v.lane &&
          other.position > v.position
        ) {
          if (!vehicleAhead || other.position < vehicleAhead.position) {
            vehicleAhead = other;
          }
        }
      }

      // Calculate desired speed
      let desiredSpeed = v.targetSpeed;
      const minFollowDistance = 14; // px gap

      // Check distance to vehicle ahead
      if (vehicleAhead) {
        const gap = vehicleAhead.position - vehicleAhead.length - v.position;
        if (gap < minFollowDistance) {
          desiredSpeed = 0;
        } else if (gap < minFollowDistance + 50) {
          // Smooth deceleration
          desiredSpeed = Math.min(desiredSpeed, vehicleAhead.speed * (gap / (minFollowDistance + 50)));
        }
      }

      // Check traffic signal stop line if not crossed yet
      if (!v.hasCrossed && v.position < stopLinePos) {
        const distToStopLine = stopLinePos - v.position;
        if (signal === 'RED' || signal === 'ALL_RED') {
          if (distToStopLine < 80) {
            desiredSpeed = Math.min(desiredSpeed, Math.max(0, (distToStopLine / 80) * 40));
          }
          if (distToStopLine <= 4) {
            desiredSpeed = 0;
          }
        } else if (signal === 'YELLOW') {
          // Yellow dilemma zone: if close, continue through; if far, brake safely
          if (distToStopLine > 45) {
            desiredSpeed = Math.min(desiredSpeed, Math.max(0, (distToStopLine / 80) * 30));
          }
        }
      }

      // Accelerate / Decelerate smoothly
      const accelRate = 90; // px/s^2
      const decelRate = 140; // px/s^2

      if (v.speed < desiredSpeed) {
        v.speed = Math.min(desiredSpeed, v.speed + accelRate * dt);
      } else if (v.speed > desiredSpeed) {
        v.speed = Math.max(desiredSpeed, v.speed - decelRate * dt);
      }

      // Advance position
      v.position += v.speed * dt;

      // Track waiting time (speed < 5 px/s)
      if (v.speed < 5 && !v.hasCrossed) {
        v.waitingTime += dt;
        v.isWaiting = true;
      } else {
        v.isWaiting = false;
      }
    }

    // 5. Cleanup vehicles that exited the intersection
    const remaining: Vehicle[] = [];
    for (const v of this.vehicles) {
      if (v.position >= roadEnd) {
        // Vehicle completed trip
        this.totalProcessedCount++;
        this.completedWaitingTimes.push(v.waitingTime);
        if (this.completedWaitingTimes.length > 500) {
          this.completedWaitingTimes.shift();
        }
      } else {
        remaining.push(v);
      }
    }
    this.vehicles = remaining;
  }

  /**
   * Get aggregate metrics
   */
  public getMetrics(): SimulationMetrics {
    const activeWaiting = this.vehicles.filter((v) => v.isWaiting);
    const totalWait = this.completedWaitingTimes.reduce((acc, val) => acc + val, 0) +
      activeWaiting.reduce((acc, v) => acc + v.waitingTime, 0);

    const totalCount = this.totalProcessedCount + activeWaiting.length;
    const avgWait = totalCount > 0 ? totalWait / totalCount : 0;
    const maxWait = Math.max(
      0,
      ...this.vehicles.map((v) => v.waitingTime),
      ...this.completedWaitingTimes
    );

    const trafficStates = this.getDirectionTrafficStates();
    const avgQueue = (
      trafficStates.north.queueLength +
      trafficStates.south.queueLength +
      trafficStates.east.queueLength +
      trafficStates.west.queueLength
    ) / 4;

    const throughput = this.elapsedTime > 0
      ? (this.totalProcessedCount / (this.elapsedTime / 60))
      : 0;

    // Congestion status
    let congestionIndex: 'low' | 'moderate' | 'heavy' | 'severe' = 'low';
    if (avgQueue > 8 || avgWait > 35) congestionIndex = 'severe';
    else if (avgQueue > 5 || avgWait > 20) congestionIndex = 'heavy';
    else if (avgQueue > 2 || avgWait > 10) congestionIndex = 'moderate';

    return {
      totalProcessed: this.totalProcessedCount,
      totalWaitingVehicles: activeWaiting.length,
      averageWaitingTime: Math.round(avgWait * 10) / 10,
      maxWaitingTime: Math.round(maxWait * 10) / 10,
      averageQueueLength: Math.round(avgQueue * 10) / 10,
      throughputPerMinute: Math.round(throughput * 10) / 10,
      clearanceTime: Math.round((avgWait + 8.5) * 10) / 10,
      congestionIndex,
      elapsedTime: Math.round(this.elapsedTime),
    };
  }
}
