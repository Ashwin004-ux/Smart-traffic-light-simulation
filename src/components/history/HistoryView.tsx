/**
 * HistoryView Component
 * Archives recorded simulation runs with metrics, scenarios, controller modes, and efficiency scores.
 */

import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Car,
  TrendingUp,
} from 'lucide-react';
import {
  SimulationSessionRecord,
  ControllerType,
  TrafficScenario,
} from '../../types/traffic';
import {
  getStoredHistory,
  clearStoredHistory,
} from '../../services/storage';

export const HistoryView: React.FC = () => {
  const [records, setRecords] = useState<SimulationSessionRecord[]>([]);
  const [filterScenario, setFilterScenario] = useState<string>('all');
  const [filterController, setFilterController] = useState<string>('all');

  useEffect(() => {
    setRecords(getStoredHistory());
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all simulation history records?')) {
      clearStoredHistory();
      setRecords([]);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `simulation_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filtered = records.filter((r) => {
    if (filterScenario !== 'all' && r.scenario !== filterScenario) return false;
    if (filterController !== 'all' && r.controllerType !== filterController) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
            <History className="w-4 h-4" />
            <span>Simulation Audit Log & Archival</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Historical Simulation Sessions
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Logged runs comparing controller variants, throughput efficiency scores, and vehicle clearance rates.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleClearHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-700">Filter Scenario:</span>
            <select
              value={filterScenario}
              onChange={(e) => setFilterScenario(e.target.value)}
              aria-label="Filter Scenario"
              className="border border-slate-300 rounded-md px-2.5 py-1 text-xs bg-slate-50 text-slate-800"
            >
              <option value="all">All Scenarios</option>
              <option value="balanced">Balanced Traffic</option>
              <option value="heavy_north_south">Heavy North-South</option>
              <option value="heavy_east_west">Heavy East-West</option>
              <option value="rush_hour">Rush Hour</option>
              <option value="emergency">Emergency Priority</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-700">Filter Controller:</span>
            <select
              value={filterController}
              onChange={(e) => setFilterController(e.target.value)}
              aria-label="Filter Controller"
              className="border border-slate-300 rounded-md px-2.5 py-1 text-xs bg-slate-50 text-slate-800"
            >
              <option value="all">All Controllers</option>
              <option value="adaptive">Adaptive Control</option>
              <option value="fixed">Pretimed (Fixed)</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Showing {filtered.length} of {records.length} records
        </span>
      </div>

      {/* Table of Records */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Scenario</th>
                <th className="py-3 px-4">Controller Mode</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Total Vehicles</th>
                <th className="py-3 px-4">Avg Wait Time</th>
                <th className="py-3 px-4">Throughput</th>
                <th className="py-3 px-4 text-right">Efficiency Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No matching simulation records found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {item.id}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {item.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize font-medium text-slate-800">
                        {item.scenario.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          item.controllerType === 'adaptive'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {item.controllerType === 'adaptive' ? 'Adaptive Control' : 'Pretimed (Fixed)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {item.durationSeconds}s
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {item.totalVehicles}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {item.avgWaitingTime}s
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {item.throughput} veh/min
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          item.efficiencyScore > 85
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.efficiencyScore > 70
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {item.efficiencyScore}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
