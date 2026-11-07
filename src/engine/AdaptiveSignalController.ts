/**
 * Adaptive Traffic Signal Controller
 * Implements dynamic green signal duration based on traffic density, queue length, and waiting time.
 * Enforces safe state machine: RED -> GREEN -> YELLOW -> ALL_RED -> NEXT_GREEN
 * Features starvation prevention and emergency vehicle preemption.
 */

import {
  Direction,
  SignalState,
  SystemSettings,
  DirectionTrafficState,
} from '../types/traffic';

export type ActivePhase = 'NORTH_SOUTH' | 'EAST_WEST';

export interface SignalControllerState {
  currentPhase: ActivePhase;
  phaseState: 'GREEN' | 'YELLOW' | 'ALL_RED';
  phaseTimeRemaining: number;
  allocatedGreenDuration: number;
  signals: Record<Direction, SignalState>;
  lastPhasePriority: {
    northSouth: number;
    eastWest: number;
  };
  eventLog: Array<{ time: string; message: string; type: 'info' | 'warning' | 'alert' }>;
}

export class AdaptiveSignalController {
  private settings: SystemSettings;
  private currentPhase: ActivePhase = 'NORTH_SOUTH';
  private phaseState: 'GREEN' | 'YELLOW' | 'ALL_RED' = 'GREEN';
  private phaseTimeRemaining: number = 20; // seconds
  private allocatedGreenDuration: number = 20;
  private lastPhasePriority = { northSouth: 0.5, eastWest: 0.5 };
  private events: Array<{ time: string; message: string; type: 'info' | 'warning' | 'alert' }> = [];
  private consecutivePhases = { NORTH_SOUTH: 0, EAST_WEST: 0 };
  private maxConsecutiveRounds = 3; // Starvation safeguard

  constructor(settings: SystemSettings) {
    this.settings = settings;
    this.addEvent('Adaptive Traffic Signal Controller initialized. Primary Phase: North-South (20s).', 'info');
  }

  public updateSettings(settings: SystemSettings) {
    this.settings = settings;
  }

  public getSignals(): Record<Direction, SignalState> {
    const signals: Record<Direction, SignalState> = {
      north: 'RED',
      south: 'RED',
      east: 'RED',
      west: 'RED',
    };

    if (this.phaseState === 'ALL_RED') {
      return signals; // all red
    }

    const state = this.phaseState; // GREEN or YELLOW
    if (this.currentPhase === 'NORTH_SOUTH') {
      signals.north = state;
      signals.south = state;
      signals.east = 'RED';
      signals.west = 'RED';
    } else {
      signals.east = state;
      signals.west = state;
      signals.north = 'RED';
      signals.south = 'RED';
    }

    return signals;
  }

  public getState(): SignalControllerState {
    return {
      currentPhase: this.currentPhase,
      phaseState: this.phaseState,
      phaseTimeRemaining: Math.max(0, Math.round(this.phaseTimeRemaining * 10) / 10),
      allocatedGreenDuration: Math.round(this.allocatedGreenDuration),
      signals: this.getSignals(),
      lastPhasePriority: this.lastPhasePriority,
      eventLog: [...this.events],
    };
  }

  private addEvent(message: string, type: 'info' | 'warning' | 'alert' = 'info') {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    this.events.unshift({ time: timeStr, message, type });
    if (this.events.length > 40) {
      this.events.pop();
    }
  }

  /**
   * Calculate Priority Score for each direction and aggregate into Phase scores.
   * Priority Score = (w1 * Norm_Count) + (w2 * Norm_Queue) + (w3 * Norm_WaitTime)
   */
  public calculatePriorities(trafficStates: Record<Direction, DirectionTrafficState>) {
    // Normalization maximums to scale metrics between 0 and 1
    const MAX_COUNT = 25;
    const MAX_QUEUE = 15;
    const MAX_WAIT = 60; // 60 seconds

    const w1 = this.settings.weightVehicleCount;
    const w2 = this.settings.weightQueueLength;
    const w3 = this.settings.weightWaitingTime;

    const calcDirScore = (d: Direction): number => {
      const state = trafficStates[d];
      if (!state) return 0;

      const normCount = Math.min(1.0, state.vehicleCount / MAX_COUNT);
      const normQueue = Math.min(1.0, state.queueLength / MAX_QUEUE);
      const normWait = Math.min(1.0, state.averageWaitingTime / MAX_WAIT);

      let score = (w1 * normCount) + (w2 * normQueue) + (w3 * normWait);

      // Emergency vehicle heavy boost
      if (this.settings.emergencyVehiclePriority && state.hasEmergency) {
        score += 2.0;
      }
      return score;
    };

    const nsScore = Math.max(calcDirScore('north'), calcDirScore('south')) * 0.7 +
                    ((calcDirScore('north') + calcDirScore('south')) / 2) * 0.3;

    const ewScore = Math.max(calcDirScore('east'), calcDirScore('west')) * 0.7 +
                    ((calcDirScore('east') + calcDirScore('west')) / 2) * 0.3;

    this.lastPhasePriority = {
      northSouth: Math.round(nsScore * 100) / 100,
      eastWest: Math.round(ewScore * 100) / 100,
    };

    return { nsScore, ewScore };
  }

  /**
   * Advance controller time by dt seconds.
   * Handles state machine transitions: GREEN -> YELLOW -> ALL_RED -> GREEN
   */
  public tick(dt: number, trafficStates: Record<Direction, DirectionTrafficState>) {
    this.phaseTimeRemaining -= dt;

    // Check emergency vehicle preemption
    if (this.settings.emergencyVehiclePriority) {
      const nsEmergency = trafficStates.north?.hasEmergency || trafficStates.south?.hasEmergency;
      const ewEmergency = trafficStates.east?.hasEmergency || trafficStates.west?.hasEmergency;

      if (ewEmergency && this.currentPhase === 'NORTH_SOUTH' && this.phaseState === 'GREEN') {
        // Preempt North-South to yield to East-West emergency
        this.addEvent('EMERGENCY PREEMPTION: Emergency vehicle on East/West! Cutting North-South green immediately.', 'alert');
        this.phaseState = 'YELLOW';
        this.phaseTimeRemaining = this.settings.yellowDuration;
        return;
      } else if (nsEmergency && this.currentPhase === 'EAST_WEST' && this.phaseState === 'GREEN') {
        // Preempt East-West to yield to North-South emergency
        this.addEvent('EMERGENCY PREEMPTION: Emergency vehicle on North/South! Cutting East-West green immediately.', 'alert');
        this.phaseState = 'YELLOW';
        this.phaseTimeRemaining = this.settings.yellowDuration;
        return;
      }
    }

    if (this.phaseTimeRemaining <= 0) {
      this.advanceStateMachine(trafficStates);
    }
  }

  private advanceStateMachine(trafficStates: Record<Direction, DirectionTrafficState>) {
    if (this.phaseState === 'GREEN') {
      // Transition from GREEN to YELLOW
      this.phaseState = 'YELLOW';
      this.phaseTimeRemaining = this.settings.yellowDuration;
      this.addEvent(`Phase ${this.currentPhase}: Green ended -> Yellow clearance (${this.settings.yellowDuration}s).`, 'info');
    } else if (this.phaseState === 'YELLOW') {
      // Transition from YELLOW to ALL_RED
      this.phaseState = 'ALL_RED';
      this.phaseTimeRemaining = this.settings.allRedDuration;
      this.addEvent(`Intersection all-red clearance interval (${this.settings.allRedDuration}s) to prevent conflicting collisions.`, 'info');
    } else if (this.phaseState === 'ALL_RED') {
      // Transition from ALL_RED to NEXT PHASE GREEN
      const { nsScore, ewScore } = this.calculatePriorities(trafficStates);

      // Alternate phase by default, unless heavy imbalance or starvation safeguard
      let nextPhase: ActivePhase = this.currentPhase === 'NORTH_SOUTH' ? 'EAST_WEST' : 'NORTH_SOUTH';

      // Anti-starvation enforcement
      if (nextPhase === 'EAST_WEST' && this.consecutivePhases.NORTH_SOUTH >= this.maxConsecutiveRounds) {
        nextPhase = 'EAST_WEST';
      } else if (nextPhase === 'NORTH_SOUTH' && this.consecutivePhases.EAST_WEST >= this.maxConsecutiveRounds) {
        nextPhase = 'NORTH_SOUTH';
      }

      this.currentPhase = nextPhase;
      this.consecutivePhases[nextPhase] += 1;
      const otherPhase = nextPhase === 'NORTH_SOUTH' ? 'EAST_WEST' : 'NORTH_SOUTH';
      this.consecutivePhases[otherPhase] = 0;

      // Calculate dynamic green duration based on target phase priority
      const targetScore = nextPhase === 'NORTH_SOUTH' ? nsScore : ewScore;
      const opposingScore = nextPhase === 'NORTH_SOUTH' ? ewScore : nsScore;

      // Base dynamic calculation: min + (ratio of target vs sum) * (max - min)
      const totalScore = Math.max(0.1, targetScore + opposingScore);
      const ratio = targetScore / totalScore; // 0.0 - 1.0

      const minG = this.settings.minGreenDuration;
      const maxG = this.settings.maxGreenDuration;
      const dynamicGreen = Math.min(maxG, Math.max(minG, Math.round(minG + ratio * (maxG - minG))));

      this.allocatedGreenDuration = dynamicGreen;
      this.phaseTimeRemaining = dynamicGreen;
      this.phaseState = 'GREEN';

      this.addEvent(
        `Dynamic Signal Allocated: ${nextPhase} GREEN for ${dynamicGreen}s (Score: ${targetScore.toFixed(2)} vs ${opposingScore.toFixed(2)}).`,
        targetScore > 1.0 ? 'warning' : 'info'
      );
    }
  }

  public reset() {
    this.currentPhase = 'NORTH_SOUTH';
    this.phaseState = 'GREEN';
    this.phaseTimeRemaining = 20;
    this.allocatedGreenDuration = 20;
    this.consecutivePhases = { NORTH_SOUTH: 0, EAST_WEST: 0 };
    this.events = [];
    this.addEvent('Adaptive Controller reset to initial state.', 'info');
  }
}
