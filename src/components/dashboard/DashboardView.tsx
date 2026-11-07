/**
 * DashboardView Component
 * Professional Urban Traffic Management Dashboard.
 * Clean municipal operations visual language, real Highway Capacity Manual (HCM) Level of Service (LOS) ratings,
 * high-density approach telemetry, and real-time density history.
 */

import React from 'react';
import {
  Car,
  Clock,
  Activity,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  SimulationMetrics,
  DirectionTrafficState,
  Direction,
  SignalState,
  ControllerType,
} from '../../types/traffic';
import { SignalControllerState } from '../../engine/AdaptiveSignalController';

interface DashboardViewProps {
  metrics: SimulationMetrics;
  directionStates: Record<Direction, DirectionTrafficState>;
  controllerState: SignalControllerState;
  controllerType: ControllerType;
  densityHistory: Array<{ time: string; north: number; south: number; east: number; west: number; avgWait: number }>;
  onNavigateToSim: () => void;
  onNavigateToDetection: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  directionStates,
  controllerState,
  controllerType,
  densityHistory,
  onNavigateToSim,
  onNavigateToDetection,
}) => {
  // Highway Capacity Manual (HCM) Level of Service (LOS) calculation based on average delay
  const getLevelOfService = (delaySec: number) => {
    if (delaySec <= 10.0) return { los: 'LOS A', desc: 'Free Flow', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (delaySec <= 20.0) return { los: 'LOS B', desc: 'Stable Flow', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (delaySec <= 35.0) return { los: 'LOS C', desc: 'Light Delay', color: 'text-slate-700 bg-slate-50 border-slate-200' };
    if (delaySec <= 55.0) return { los: 'LOS D', desc: 'Moderate Queue', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (delaySec <= 80.0) return { los: 'LOS E', desc: 'Capacity Limit', color: 'text-orange-700 bg-orange-50 border-orange-200' };
    return { los: 'LOS F', desc: 'Breakdown / Jam', color: 'text-red-700 bg-red-50 border-red-200' };
  };

  const losInfo = getLevelOfService(metrics.averageWaitingTime);

  const getDirIcon = (dir: Direction) => {
    switch (dir) {
      case 'north': return ArrowDown;
      case 'south': return ArrowUp;
      case 'west': return ArrowRight;
      case 'east': return ArrowLeft;
    }
  };

  const getSignalAspectStyle = (state: SignalState) => {
    switch (state) {
      case 'GREEN': return 'bg-emerald-600 text-white';
      case 'YELLOW': return 'bg-amber-400 text-slate-900';
      case 'RED':
      case 'ALL_RED':
      default:
        return 'bg-red-600 text-white';
    }
  };

  const totalDensity = Math.round(
    (directionStates.north.density +
      directionStates.south.density +
      directionStates.east.density +
      directionStates.west.density) / 4
  );

  return (
    <div className="space-y-5">
      {/* Municipal Operations Sub-Header Bar */}
      <div className="bg-white rounded-lg border border-slate-200 px-5 py-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
            <span>District 4 Traffic Management Center</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-700">Controller ID: NEMA-TS2-104</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">
            Main Arterial & 4th Avenue Intersection
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {controllerType === 'adaptive'
              ? 'Actuated Adaptive Control active. Split times are continuously recalculated from arrival rates, queue accumulation, and dwell delay.'
              : 'Pretimed Signal Timing Plan active. 30-second fixed phase cycles without demand actuation.'}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onNavigateToSim}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition cursor-pointer shadow-xs"
          >
            Open Live Intersection
          </button>
          <button
            onClick={onNavigateToDetection}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded border border-slate-300 transition cursor-pointer"
          >
            Camera Detection
          </button>
        </div>
      </div>

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Processed */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Total Vehicles Cleared</span>
            <Car className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {metrics.totalProcessed}
            </span>
            <span className="text-xs text-slate-500">vehicles</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Discharge Rate:</span>
            <span className="font-semibold text-slate-800 font-mono tabular-nums">
              {metrics.throughputPerMinute} veh/min
            </span>
          </div>
        </div>

        {/* Metric 2: Average Density */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Average Approach Density</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {totalDensity}%
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${losInfo.color}`}>
              {losInfo.los} · {losInfo.desc}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Queued Demand:</span>
            <span className="font-semibold text-slate-800 font-mono tabular-nums">
              {metrics.totalWaitingVehicles} vehicles
            </span>
          </div>
        </div>

        {/* Metric 3: Average Delay */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Average Vehicle Delay</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {metrics.averageWaitingTime}s
            </span>
            <span className="text-xs text-slate-500">per vehicle</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Maximum Delay:</span>
            <span className="font-semibold text-slate-800 font-mono tabular-nums">
              {metrics.maxWaitingTime}s
            </span>
          </div>
        </div>

        {/* Metric 4: Active Green Phase */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Active Green Phase</span>
            <Zap className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-base font-bold text-slate-900">
              {controllerState.currentPhase === 'NORTH_SOUTH' ? 'Phase 2 & 6 (N/S)' : 'Phase 4 & 8 (E/W)'}
            </span>
            <span className="text-xs font-mono font-bold text-blue-700">
              {Math.ceil(controllerState.phaseTimeRemaining)}s remaining
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Allocated Split:</span>
            <span className="font-semibold text-slate-800 font-mono tabular-nums">
              {controllerState.allocatedGreenDuration}s
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: 4-Way Approach Telemetry & Real-Time Density Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Approach Telemetry Column */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-900 text-sm">Approach Queues & Signal Aspects</h4>
            <span className="text-xs text-slate-500 font-mono">4 Approaches</span>
          </div>

          <div className="space-y-2">
            {(['north', 'south', 'east', 'west'] as Direction[]).map((dir) => {
              const state = directionStates[dir];
              const Icon = getDirIcon(dir);
              const signal = controllerState.signals[dir];

              return (
                <div
                  key={dir}
                  className="p-2.5 rounded border border-slate-200/80 bg-slate-50/60 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold uppercase text-slate-800">
                          {dir}bound Approach
                        </span>
                        {state.hasEmergency && (
                          <span className="text-[10px] text-red-700 font-bold bg-red-100 px-1 rounded">
                            EMERGENCY
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 space-x-1.5 font-mono">
                        <span>Vehicles: <b className="text-slate-800">{state.vehicleCount}</b></span>
                        <span aria-hidden="true">·</span>
                        <span>Queue: <b className="text-slate-800">{state.queueLength}</b></span>
                        <span aria-hidden="true">·</span>
                        <span>Delay: <b className="text-slate-800">{state.averageWaitingTime}s</b></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-800">{state.density}%</div>
                      <div className="text-[10px] text-slate-400">density</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold shadow-2xs ${getSignalAspectStyle(
                        signal
                      )}`}
                    >
                      {signal}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Density Trends Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Approach Density Trends</h4>
              <p className="text-xs text-slate-500">Continuous queue saturation per direction</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                <span className="text-slate-600">North</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
                <span className="text-slate-600">South</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span className="text-slate-600">East</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                <span className="text-slate-600">West</span>
              </span>
            </div>
          </div>

          <div className="h-60 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={densityHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '4px', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="north" stroke="#2563eb" fillOpacity={0.15} fill="#2563eb" strokeWidth={1.5} />
                <Area type="monotone" dataKey="south" stroke="#059669" fillOpacity={0.1} fill="#059669" strokeWidth={1.5} />
                <Area type="monotone" dataKey="east" stroke="#d97706" fillOpacity={0.1} fill="#d97706" strokeWidth={1.5} />
                <Area type="monotone" dataKey="west" stroke="#dc2626" fillOpacity={0.05} fill="#dc2626" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Intersection Standard: <b>NEMA TS2 Type 1 Actuated Phasing</b></span>
            <span>Safety Interlock: <b className="text-emerald-700">Conflict Monitor Active</b></span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Priority Scoring Telemetry & Operational Event Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Priority Computation Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-900 text-sm">Dynamic Priority Formulation</h4>
            <p className="text-xs text-slate-500">Mathematical demand allocation</p>
          </div>

          <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs font-mono text-slate-700">
            Score = (0.45 · NormCount) + (0.30 · NormQueue) + (0.25 · NormWait)
            <div className="mt-2 flex items-center justify-between font-sans">
              <span className="text-slate-600">North-South Phase Priority:</span>
              <span className="font-mono font-bold text-blue-700">
                {controllerState.lastPhasePriority.northSouth}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between font-sans">
              <span className="text-slate-600">East-West Phase Priority:</span>
              <span className="font-mono font-bold text-amber-700">
                {controllerState.lastPhasePriority.eastWest}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed">
            Phase duration dynamically scales between 10s and 60s. Starvation prevention ensures cross-street queues never wait longer than 3 consecutive phase intervals.
          </div>
        </div>

        {/* Operational Log Feed */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Controller Operations Log</h4>
              <p className="text-xs text-slate-500">Real-time signal transitions, clearance intervals, and preemption events</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">CHRONOLOGICAL</span>
          </div>

          <div className="mt-2.5 space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {controllerState.eventLog.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No controller events recorded yet.</div>
            ) : (
              controllerState.eventLog.slice(0, 8).map((evt, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded text-xs flex items-start space-x-2 border ${
                    evt.type === 'alert'
                      ? 'bg-red-50 border-red-200 text-red-900 font-medium'
                      : evt.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900 font-medium'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="font-mono text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">
                    {evt.time}
                  </span>
                  <span className="flex-1 leading-snug">{evt.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
