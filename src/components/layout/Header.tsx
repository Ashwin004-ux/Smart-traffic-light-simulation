/**
 * Header Component
 * Clean top bar conforming to operational DOT / municipal console guidelines.
 */

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SlidersHorizontal,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { ControllerType } from '../../types/traffic';

interface HeaderProps {
  title: string;
  subtitle: string;
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  simSpeed: number;
  onChangeSpeed: (speed: number) => void;
  controllerType: ControllerType;
  onChangeControllerType: (type: ControllerType) => void;
  hasEmergency?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  isRunning,
  onTogglePlay,
  onReset,
  simSpeed,
  onChangeSpeed,
  controllerType,
  onChangeControllerType,
  hasEmergency = false,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Title & Operational Context */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <span>Smart Traffic</span>
          <span aria-hidden="true">·</span>
          <span>Junction #104</span>
          <span aria-hidden="true">·</span>
          <span>4th Ave & Main St</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">{title}</h2>
      </div>

      {/* Controls & Mode Selectors */}
      <div className="flex items-center flex-wrap gap-3">
        {/* Emergency Alert Banner */}
        {hasEmergency && (
          <div className="flex items-center space-x-1.5 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>Emergency Vehicle Priority Active</span>
          </div>
        )}

        {/* Controller Timing Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-xs font-medium">
          <button
            onClick={() => onChangeControllerType('adaptive')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition cursor-pointer ${
              controllerType === 'adaptive'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Adaptive Control</span>
          </button>
          <button
            onClick={() => onChangeControllerType('fixed')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition cursor-pointer ${
              controllerType === 'fixed'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pretimed (Fixed)</span>
          </button>
        </div>

        {/* Speed Multiplier */}
        <div className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded border border-slate-200 text-xs">
          <span className="text-slate-500 text-[11px] font-medium mr-1">Speed:</span>
          {[1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangeSpeed(spd)}
              className={`px-2 py-0.5 rounded font-mono font-medium transition text-xs cursor-pointer ${
                simSpeed === spd
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Simulation Execution Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onTogglePlay}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white transition cursor-pointer shadow-xs ${
              isRunning
                ? 'bg-slate-800 hover:bg-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition cursor-pointer"
            title="Reset Simulation State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
