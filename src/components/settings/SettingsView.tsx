/**
 * SettingsView Component
 * Configuration interface for Adaptive Algorithm weights, signal intervals,
 * safety clearance times, and detection hyperparameters.
 */

import React, { useState } from 'react';
import {
  Settings,
  RotateCcw,
  Save,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { SystemSettings } from '../../types/traffic';
import { DEFAULT_SETTINGS } from '../../services/storage';

interface SettingsViewProps {
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleWeightChange = (field: 'weightVehicleCount' | 'weightQueueLength' | 'weightWaitingTime', val: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.round(val * 100) / 100,
    }));
  };

  const handleNormalizeWeights = () => {
    const sum = formData.weightVehicleCount + formData.weightQueueLength + formData.weightWaitingTime;
    if (sum <= 0) return;
    setFormData((prev) => ({
      ...prev,
      weightVehicleCount: Math.round((prev.weightVehicleCount / sum) * 100) / 100,
      weightQueueLength: Math.round((prev.weightQueueLength / sum) * 100) / 100,
      weightWaitingTime: Math.round((prev.weightWaitingTime / sum) * 100) / 100,
    }));
  };

  const handleResetDefaults = () => {
    setFormData({ ...DEFAULT_SETTINGS });
    onSaveSettings({ ...DEFAULT_SETTINGS });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const totalWeight = Math.round(
    (formData.weightVehicleCount + formData.weightQueueLength + formData.weightWaitingTime) * 100
  ) / 100;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header & Save Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
            <Settings className="w-4 h-4" />
            <span>Algorithm & Simulation Tuning</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            System Parameters & Configuration
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Configure dynamic green boundaries, weighted priority hyperparameters, and collision clearance intervals.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {saveSuccess && (
            <span className="flex items-center space-x-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Configuration Applied</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Defaults</span>
          </button>

          <button
            type="submit"
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Adaptive Priority Weights */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm">Priority Scoring Formula Weights</h4>
            </div>
            <button
              type="button"
              onClick={handleNormalizeWeights}
              className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Normalize to 1.0
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-700">
            Priority Score = (<b>w1</b> × NormCount) + (<b>w2</b> × NormQueue) + (<b>w3</b> × NormWait)
            <div className="mt-1 text-slate-500 text-[11px]">
              Current Sum: <span className={totalWeight === 1.0 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{totalWeight.toFixed(2)}</span> (Recommended: 1.00)
            </div>
          </div>

          {/* Slider 1: Vehicle Count Weight */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>w1: Vehicle Count Weight</span>
              <span className="font-mono font-bold text-blue-600">{formData.weightVehicleCount}</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={1.0}
              step={0.05}
              value={formData.weightVehicleCount}
              onChange={(e) => handleWeightChange('weightVehicleCount', Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Slider 2: Queue Length Weight */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>w2: Queue Length Weight</span>
              <span className="font-mono font-bold text-blue-600">{formData.weightQueueLength}</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={1.0}
              step={0.05}
              value={formData.weightQueueLength}
              onChange={(e) => handleWeightChange('weightQueueLength', Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Slider 3: Waiting Time Weight */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>w3: Accumulated Waiting Time Weight</span>
              <span className="font-mono font-bold text-blue-600">{formData.weightWaitingTime}</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={1.0}
              step={0.05}
              value={formData.weightWaitingTime}
              onChange={(e) => handleWeightChange('weightWaitingTime', Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <p className="text-[11px] text-slate-500 pt-1">
            Increasing waiting time weight prioritizes starvation avoidance on low-density cross streets.
          </p>
        </div>

        {/* Section 2: Traffic Signal Timing Boundaries */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-slate-900 text-sm">Signal Timing Boundaries & Safety Interlocks</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Minimum Green Time (s)
              </label>
              <input
                type="number"
                min={5}
                max={30}
                value={formData.minGreenDuration}
                onChange={(e) => setFormData({ ...formData, minGreenDuration: Number(e.target.value) })}
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-slate-50 text-slate-900"
              />
              <span className="text-[10px] text-slate-400">Default: 10s</span>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Maximum Green Time (s)
              </label>
              <input
                type="number"
                min={30}
                max={120}
                value={formData.maxGreenDuration}
                onChange={(e) => setFormData({ ...formData, maxGreenDuration: Number(e.target.value) })}
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-slate-50 text-slate-900"
              />
              <span className="text-[10px] text-slate-400">Default: 60s</span>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Yellow Transition (s)
              </label>
              <input
                type="number"
                min={2}
                max={6}
                value={formData.yellowDuration}
                onChange={(e) => setFormData({ ...formData, yellowDuration: Number(e.target.value) })}
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-slate-50 text-slate-900"
              />
              <span className="text-[10px] text-slate-400">Default: 3s</span>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                All-Red Clearance Interval (s)
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={formData.allRedDuration}
                onChange={(e) => setFormData({ ...formData, allRedDuration: Number(e.target.value) })}
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-slate-50 text-slate-900"
              />
              <span className="text-[10px] text-slate-400">Default: 2s</span>
            </div>
          </div>

          {/* Section: Fixed Controller green time */}
          <div className="pt-2 border-t border-slate-100">
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Fixed-Time Baseline Green Duration (s)
            </label>
            <input
              type="number"
              min={15}
              max={60}
              value={formData.fixedGreenDuration}
              onChange={(e) => setFormData({ ...formData, fixedGreenDuration: Number(e.target.value) })}
              className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-slate-50 text-slate-900"
            />
            <span className="text-[10px] text-slate-400">
              Duration allocated per phase when Fixed-Time mode is selected for benchmarking.
            </span>
          </div>
        </div>

        {/* Section 3: Emergency Vehicle Preemption & CV Thresholds */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <h4 className="font-bold text-slate-900 text-sm">Emergency Vehicle Preemption & Vision Thresholds</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Emergency Toggle */}
            <div className="flex items-start space-x-3 p-3 bg-red-50/50 rounded-lg border border-red-100">
              <input
                type="checkbox"
                id="emergencyToggle"
                checked={formData.emergencyVehiclePriority}
                onChange={(e) => setFormData({ ...formData, emergencyVehiclePriority: e.target.checked })}
                className="mt-1 rounded text-red-600 accent-red-600 cursor-pointer w-4 h-4"
              />
              <label htmlFor="emergencyToggle" className="cursor-pointer">
                <span className="text-xs font-bold text-red-900 block">
                  Enable Emergency Vehicle Priority (Preemption)
                </span>
                <span className="text-[11px] text-red-700 leading-snug block mt-0.5">
                  When an ambulance or emergency vehicle is detected in an incoming queue, the controller immediately cuts conflicting phases and grants green clearance.
                </span>
              </label>
            </div>

            {/* Vision Threshold */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Computer Vision Confidence Threshold</span>
                <span className="font-mono font-bold text-blue-600">
                  {(formData.confidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0.20}
                max={0.95}
                step={0.05}
                value={formData.confidenceThreshold}
                onChange={(e) => setFormData({ ...formData, confidenceThreshold: Number(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">
                Minimum classification confidence required to register bounding boxes.
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
