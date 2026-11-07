/**
 * Traditional Fixed-Time Traffic Signal Controller (Benchmark Baseline)
 * Switches signals on static predetermined cycle timings (e.g., 30s Green, 3s Yellow, 2s All-Red).
 * Used for rigorous comparison against the AI-Adaptive algorithm.
 */

import { Direction, SignalState, SystemSettings } from '../types/traffic';
import { ActivePhase, SignalControllerState } from './AdaptiveSignalController';

export class FixedSignalController {
  private settings: SystemSettings;
  private currentPhase: ActivePhase = 'NORTH_SOUTH';
  private phaseState: 'GREEN' | 'YELLOW' | 'ALL_RED' = 'GREEN';
  private phaseTimeRemaining: number = 30;
  private fixedGreen: number = 30;

  constructor(settings: SystemSettings) {
    this.settings = settings;
    this.fixedGreen = settings.fixedGreenDuration || 30;
    this.phaseTimeRemaining = this.fixedGreen;
  }

  public updateSettings(settings: SystemSettings) {
    this.settings = settings;
    this.fixedGreen = settings.fixedGreenDuration || 30;
  }

  public getSignals(): Record<Direction, SignalState> {
    const signals: Record<Direction, SignalState> = {
      north: 'RED',
      south: 'RED',
      east: 'RED',
      west: 'RED',
    };

    if (this.phaseState === 'ALL_RED') {
      return signals;
    }

    const state = this.phaseState;
    if (this.currentPhase === 'NORTH_SOUTH') {
      signals.north = state;
      signals.south = state;
    } else {
      signals.east = state;
      signals.west = state;
    }
    return signals;
  }

  public getState(): SignalControllerState {
    return {
      currentPhase: this.currentPhase,
      phaseState: this.phaseState,
      phaseTimeRemaining: Math.max(0, Math.round(this.phaseTimeRemaining * 10) / 10),
      allocatedGreenDuration: this.fixedGreen,
      signals: this.getSignals(),
      lastPhasePriority: { northSouth: 0.5, eastWest: 0.5 },
      eventLog: [
        {
          time: new Date().toTimeString().split(' ')[0],
          message: `Fixed-time controller cycle running (${this.fixedGreen}s green static).`,
          type: 'info',
        },
      ],
    };
  }

  public tick(dt: number) {
    this.phaseTimeRemaining -= dt;

    if (this.phaseTimeRemaining <= 0) {
      if (this.phaseState === 'GREEN') {
        this.phaseState = 'YELLOW';
        this.phaseTimeRemaining = this.settings.yellowDuration;
      } else if (this.phaseState === 'YELLOW') {
        this.phaseState = 'ALL_RED';
        this.phaseTimeRemaining = this.settings.allRedDuration;
      } else if (this.phaseState === 'ALL_RED') {
        this.currentPhase = this.currentPhase === 'NORTH_SOUTH' ? 'EAST_WEST' : 'NORTH_SOUTH';
        this.phaseState = 'GREEN';
        this.phaseTimeRemaining = this.fixedGreen;
      }
    }
  }

  public reset() {
    this.currentPhase = 'NORTH_SOUTH';
    this.phaseState = 'GREEN';
    this.phaseTimeRemaining = this.fixedGreen;
  }
}
