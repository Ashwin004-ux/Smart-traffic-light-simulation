/**
 * AboutView Component
 * Architectural documentation, mathematical formulations, safe finite state machine,
 * and Python backend execution guide.
 */

import React from 'react';
import {
  Info,
  Cpu,
  Layers,
  ShieldCheck,
  Video,
  Database,
  Terminal,
  CheckCircle2,
  FileCode,
} from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
          <Info className="w-4 h-4 text-slate-600" />
          <span>System Architecture & Engineering Specification</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mt-1">
          Smart Traffic: Operations & Control Architecture
        </h3>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          An intelligent municipal traffic management system combining real-time computer vision vehicle detection, Centroid trajectory tracking, and multi-variable actuated signal split optimization for four-way road intersections.
        </p>
      </div>

      {/* System Pipeline Architecture Diagram */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Layers className="w-5 h-5 text-blue-600" />
          <h4 className="font-bold text-slate-900 text-base">End-to-End Processing Architecture</h4>
        </div>

        <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
          <pre>{`Video Input / CCTV Camera Feed
       │
       ▼
OpenCV Frame Extraction & Normalization
       │
       ▼
YOLOv8 Object Detection (Car, Truck, Bus, Motorcycle, Emergency)
       │
       ▼
Centroid / SORT Multi-Object Tracking (Persistent Track IDs)
       │
       ▼
Directional Counting Lines & Traffic Density Calculation
       │
       ▼
Adaptive Signal Priority Engine (Weighted Dynamic Formulation)
       │
       ▼
Safe Finite State Machine Controller (Anti-Collision Interlocks)
       │
       ├──► FastAPI Backend (REST & WebSocket Telemetry)
       └──► Next.js / React 19 Live Interactive Dashboard`}</pre>
        </div>
      </div>

      {/* Algorithm Formulation & State Machine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Priority Formula */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-slate-900 text-sm">Dynamic Priority Scoring Formulation</h4>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs font-mono text-blue-900">
            Priority Score = (w1 × NormCount) + (w2 × NormQueue) + (w3 × NormWait)
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>
              Where:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li><b>w1 (0.45)</b>: Weight assigned to total detected vehicle count.</li>
              <li><b>w2 (0.30)</b>: Weight assigned to vehicles currently backed up in queue.</li>
              <li><b>w3 (0.25)</b>: Weight assigned to cumulative waiting time.</li>
            </ul>
            <p>
              <b>Starvation Safeguard:</b> As vehicles wait at a red light, cumulative waiting time increases linearly, ensuring even low-density side streets achieve sufficient priority to receive green clearance within reasonable time bounds.
            </p>
          </div>
        </div>

        {/* Finite State Machine */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h4 className="font-bold text-slate-900 text-sm">Safe Finite State Machine (FSM)</h4>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-slate-800">
            RED ➔ GREEN (10-60s) ➔ YELLOW (3s) ➔ ALL-RED (2s) ➔ NEXT GREEN
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>
              <b>Zero Conflicting Green Guarantee:</b> Signals on conflicting approaches (North/South vs. East/West) can NEVER display Green simultaneously.
            </p>
            <p>
              <b>All-Red Clearance Interval:</b> A mandatory 2-second all-red phase is enforced on every phase change, ensuring vehicles clearing the junction box exit safely before cross-traffic enters.
            </p>
            <p>
              <b>Emergency Preemption:</b> When an emergency vehicle is detected on an incoming queue, conflicting greens are immediately transitioned to Yellow ➔ All-Red ➔ Green for the emergency approach.
            </p>
          </div>
        </div>
      </div>

      {/* Python Backend & Local Setup Guide */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Terminal className="w-5 h-5 text-slate-800" />
          <h4 className="font-bold text-slate-900 text-base">
            Local Execution Guide (Python FastAPI + Windows / PowerShell / VS Code)
          </h4>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          All Python backend files, OpenCV/YOLO inference modules, SQLAlchemy database schemas, and FastAPI REST/WebSocket endpoints are included in the repository under <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">/backend</code>.
        </p>

        <div className="space-y-3 text-xs">
          <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs space-y-2">
            <div className="text-slate-400"># 1. Clone repository and navigate to backend directory</div>
            <div className="text-blue-400">cd backend</div>
            <div className="text-slate-400"># 2. Create and activate Python virtual environment in PowerShell</div>
            <div className="text-emerald-400">python -m venv venv</div>
            <div className="text-emerald-400">.\venv\Scripts\Activate.ps1</div>
            <div className="text-slate-400"># 3. Install dependencies from requirements.txt</div>
            <div className="text-yellow-400">pip install -r requirements.txt</div>
            <div className="text-slate-400"># 4. Start FastAPI server with live reload</div>
            <div className="text-white">uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs">
            <b>Database Support:</b> The backend automatically connects to PostgreSQL via SQLAlchemy if configured in <code className="font-mono text-slate-800">.env</code>, or defaults seamlessly to an embedded SQLite database (<code className="font-mono text-slate-800">traffic_system.db</code>) for instant local zero-configuration development!
          </div>
        </div>
      </div>
    </div>
  );
};
