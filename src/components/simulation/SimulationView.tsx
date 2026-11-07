/**
 * SimulationView Component
 * Intersection Simulation Workspace.
 * Clean municipal operations controls, traffic scenario selector,
 * approach queue metrics, and manual vehicle injection.
 */

import React, { useState } from 'react';
import {
  Car,
  Truck,
  Bus,
  Bike,
  PlusCircle,
  Eye,
  SlidersHorizontal,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import {
  Direction,
  SignalState,
  TrafficScenario,
  Vehicle,
  VehicleType,
  DirectionTrafficState,
  SimulationMetrics,
  ControllerType,
} from '../../types/traffic';
import { IntersectionCanvas } from './IntersectionCanvas';
import { SignalControllerState } from '../../engine/AdaptiveSignalController';

interface SimulationViewProps {
  vehicles: Vehicle[];
  signals: Record<Direction, SignalState>;
  controllerState: SignalControllerState;
  directionStates: Record<Direction, DirectionTrafficState>;
  metrics: SimulationMetrics;
  scenario: TrafficScenario;
  onSelectScenario: (sc: TrafficScenario) => void;
  controllerType: ControllerType;
  onChangeControllerType: (ct: ControllerType) => void;
  arrivalRate: number;
  onChangeArrivalRate: (rate: number) => void;
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onSpawnVehicle: (dir: Direction, type?: VehicleType) => void;
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  vehicles,
  signals,
  controllerState,
  directionStates,
  metrics,
  scenario,
  onSelectScenario,
  controllerType,
  onChangeControllerType,
  arrivalRate,
  onChangeArrivalRate,
  isRunning,
  onTogglePlay,
  onReset,
  onSpawnVehicle,
}) => {
  const [showDebug, setShowDebug] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState<Direction>('north');

  const scenarios: Array<{ id: TrafficScenario; label: string; desc: string }> = [
    { id: 'balanced', label: 'Balanced Grid Flow', desc: 'Equal distribution across all four approaches.' },
    { id: 'heavy_north_south', label: 'Major Arterial (Heavy N/S)', desc: '84% arterial volume on North/South, low cross-traffic.' },
    { id: 'heavy_east_west', label: 'Major Arterial (Heavy E/W)', desc: '84% arterial volume on East/West, low cross-traffic.' },
    { id: 'rush_hour', label: 'Peak Hour Commute', desc: 'High overall density with periodic arterial surges.' },
    { id: 'emergency', label: 'Emergency Preemption', desc: 'Periodic ambulances testing instant phase preemption.' },
    { id: 'random', label: 'Stochastic Poisson Flow', desc: 'Randomized Poisson vehicle arrivals.' },
  ];

  return (
    <div className="space-y-5">
      {/* Simulation Command Toolbar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Scenario Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Traffic Scenario:</span>
          <select
            value={scenario}
            onChange={(e) => onSelectScenario(e.target.value as TrafficScenario)}
            aria-label="Traffic Scenario"
            className="text-xs font-medium border border-slate-300 rounded px-2.5 py-1.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.label}
              </option>
            ))}
          </select>
        </div>

        {/* Demand Arrival Rate */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-slate-700">Demand Rate:</span>
          <input
            type="range"
            min={10}
            max={60}
            step={2}
            value={arrivalRate}
            onChange={(e) => onChangeArrivalRate(Number(e.target.value))}
            aria-label="Vehicle Arrival Rate"
            className="w-28 accent-blue-600 cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {arrivalRate} veh/min
          </span>
        </div>

        {/* Telemetry Display Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium border transition cursor-pointer ${
              showDebug
                ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Delay Telemetry</span>
          </button>
        </div>
      </div>

      {/* Main Grid: CAD Canvas (Left) + Queue Telemetry & Injector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Intersection CAD Viewport (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Intersection CAD Operations Viewport</h3>
              <p className="text-xs text-slate-500">
                Pavement markings, stop bar compliance, and vehicle queueing
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700">
              {vehicles.length} Active Vehicles
            </span>
          </div>

          <IntersectionCanvas
            vehicles={vehicles}
            signals={signals}
            phaseRemaining={controllerState.phaseTimeRemaining}
            activePhase={controllerState.currentPhase}
            showDebug={showDebug}
            onSpawnVehicle={(dir) => onSpawnVehicle(dir)}
          />

          <div className="w-full mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
            <span>Click margin buttons to inject vehicle into approach lane.</span>
            <span>Scale: 1:1 Urban Standard</span>
          </div>
        </div>

        {/* Right Telemetry Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Phase Controller Status */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Phase Timing & Actuation
              </h4>
              <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {controllerType === 'adaptive' ? 'Adaptive Split' : 'Pretimed 30s'}
              </span>
            </div>

            <div className="p-3 bg-slate-900 text-white rounded space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Green Phase:</span>
                <span className="font-bold text-emerald-400">
                  {controllerState.currentPhase === 'NORTH_SOUTH' ? 'Phase 2 & 6 (NB/SB)' : 'Phase 4 & 8 (EB/WB)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Interval Duration:</span>
                <span className="text-blue-300 font-bold">{controllerState.allocatedGreenDuration}s</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Time Remaining:</span>
                <span className="text-amber-300 font-bold">{Math.ceil(controllerState.phaseTimeRemaining)}s</span>
              </div>

              {/* Phase Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 transition-all duration-300"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        (controllerState.phaseTimeRemaining / controllerState.allocatedGreenDuration) * 100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Approach Queue Lengths */}
            <div className="space-y-2 pt-1">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Approach Queue Saturation
              </h5>

              {(['north', 'south', 'east', 'west'] as Direction[]).map((dir) => {
                const state = directionStates[dir];
                const signal = signals[dir];
                return (
                  <div key={dir} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="uppercase text-slate-700">{dir}bound:</span>
                      <div className="flex items-center space-x-2 text-xs font-mono">
                        <span className="text-slate-500">{state.queueLength} queued</span>
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                            signal === 'GREEN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : signal === 'YELLOW'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {signal}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          state.density > 75 ? 'bg-red-600' : state.density > 45 ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${state.density}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manual Vehicle Injection Console */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Manual Vehicle Injection
              </h4>
              <span className="text-xs text-slate-400 font-mono">TEST UNIT</span>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Select Approach Road:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['north', 'south', 'east', 'west'] as Direction[]).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setSelectedDirection(dir)}
                    className={`py-1 text-xs font-bold uppercase rounded border transition cursor-pointer ${
                      selectedDirection === dir
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Vehicle Category on {selectedDirection.toUpperCase()} Approach:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSpawnVehicle(selectedDirection, 'car')}
                  className="flex items-center space-x-2 p-2 rounded border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-800 transition cursor-pointer"
                >
                  <Car className="w-3.5 h-3.5 text-blue-600" />
                  <span>Passenger Car</span>
                </button>
                <button
                  onClick={() => onSpawnVehicle(selectedDirection, 'truck')}
                  className="flex items-center space-x-2 p-2 rounded border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-800 transition cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Heavy Truck</span>
                </button>
                <button
                  onClick={() => onSpawnVehicle(selectedDirection, 'bus')}
                  className="flex items-center space-x-2 p-2 rounded border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-800 transition cursor-pointer"
                >
                  <Bus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Transit Bus</span>
                </button>
                <button
                  onClick={() => onSpawnVehicle(selectedDirection, 'emergency')}
                  className="flex items-center space-x-2 p-2 rounded border border-red-300 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 transition cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>Ambulance (Preempt)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
