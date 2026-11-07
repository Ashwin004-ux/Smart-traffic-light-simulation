/**
 * DetectionView Component
 * Optical Vehicle Detection & Multi-Object Tracking Console.
 * Professional Traffic Management Center (TMC) camera inspection viewport.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  Upload,
  SlidersHorizontal,
  Camera,
  CheckCircle,
} from 'lucide-react';
import { ComputerVisionDetector } from '../../engine/ComputerVisionDetector';
import { DetectionStats } from '../../types/traffic';

interface DetectionViewProps {
  detector: ComputerVisionDetector;
}

export const DetectionView: React.FC<DetectionViewProps> = ({ detector }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isProcessing, setIsProcessing] = useState(detector.getIsProcessing());
  const [confidence, setConfidence] = useState(detector.getConfidenceThreshold());
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [showCountingLines, setShowCountingLines] = useState(true);
  const [videoSource, setVideoSource] = useState<'synthetic' | 'custom'>('synthetic');
  const [stats, setStats] = useState<DetectionStats>(detector.getStats());

  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          detector.renderCameraFeed(ctx, canvas.width, canvas.height, showBoundingBoxes);
        }
      }
      setStats(detector.getStats());
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [detector, showBoundingBoxes]);

  const handleToggleProcessing = () => {
    const running = detector.toggleProcessing();
    setIsProcessing(running);
  };

  const handleReset = () => {
    detector.reset();
    setStats(detector.getStats());
  };

  const handleConfidenceChange = (val: number) => {
    setConfidence(val);
    detector.setConfidenceThreshold(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoSource('custom');
    }
  };

  return (
    <div className="space-y-5">
      {/* TMC Camera Console Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <Camera className="w-4 h-4 text-slate-700" />
            <span>TMC Optical Video Detection Console</span>
            <span aria-hidden="true">·</span>
            <span>Camera Node 04</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">
            Approach Optical Detection & Multi-Object Vehicle Tracking
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Real-time frame extraction, vehicle classification, Centroid trajectory tracking, and directional tripwire counting to prevent duplicate registration.
          </p>
        </div>

        {/* Video Source Controls */}
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="video/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded border border-slate-300 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Traffic Video</span>
          </button>
          <button
            onClick={() => setVideoSource('synthetic')}
            className={`px-3 py-1.5 text-xs font-medium rounded border transition cursor-pointer ${
              videoSource === 'synthetic'
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            CCTV Intersection Feed
          </button>
        </div>
      </div>

      {/* Main Grid: Video Screen (Left) + Telemetry (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CCTV Monitor Viewport (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950 rounded-lg border border-slate-800 p-3.5 shadow-md flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2 text-xs text-slate-400 pb-2 border-b border-slate-800 font-mono">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-slate-200 font-medium">CAM-04 · APPROACH NORTH-WEST · 1080P</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-emerald-400">{stats.fps} FPS</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">{stats.latencyMs}ms Latency</span>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div className="relative w-full aspect-video bg-black rounded overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={640}
              height={360}
              className="w-full h-full object-contain"
            />
          </div>

          {/* CCTV Toolbar */}
          <div className="w-full mt-3 flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleProcessing}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white transition cursor-pointer ${
                  isProcessing ? 'bg-slate-800 hover:bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Detection</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume Detection</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Counts</span>
              </button>
            </div>

            {/* Overlays */}
            <div className="flex items-center space-x-4 text-slate-300">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBoundingBoxes}
                  onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                  className="rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
                <span className="text-xs">Bounding Boxes</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCountingLines}
                  onChange={(e) => setShowCountingLines(e.target.checked)}
                  className="rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
                <span className="text-xs">Tripwire Lines</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Telemetry Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Tally Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Optical Sensor Tallies
              </h4>
              <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-xs text-slate-500 block">Total Vehicles Counted</span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block tabular-nums">
                  {stats.totalDetections}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-xs text-slate-500 block">Active Track IDs</span>
                <span className="text-xl font-bold font-mono text-blue-700 mt-0.5 block tabular-nums">
                  {stats.activeTracks}
                </span>
              </div>
            </div>

            {/* Counts by Tripwire Line */}
            <div className="space-y-1.5 pt-1">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Approach Stop Bar Crossings
              </h5>
              <div className="space-y-1 text-xs">
                {detector.countingLines.map((line) => (
                  <div
                    key={line.id}
                    className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: line.color }} />
                      <span className="font-medium text-slate-700">{line.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {line.count} passed
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Counts by Class */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Vehicle Classification
              </h5>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                <div className="flex justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-600">Cars:</span>
                  <span className="font-bold tabular-nums">{stats.countByType.car}</span>
                </div>
                <div className="flex justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-600">Trucks:</span>
                  <span className="font-bold tabular-nums">{stats.countByType.truck}</span>
                </div>
                <div className="flex justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-600">Buses:</span>
                  <span className="font-bold tabular-nums">{stats.countByType.bus}</span>
                </div>
                <div className="flex justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-600">M/Cycles:</span>
                  <span className="font-bold tabular-nums">{stats.countByType.motorcycle}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Confidence Slider */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Detection Confidence Cutoff
              </h4>
              <span className="font-mono font-bold text-blue-700 text-xs">
                {(confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="space-y-1.5">
              <input
                type="range"
                min={0.20}
                max={0.95}
                step={0.05}
                value={confidence}
                onChange={(e) => handleConfidenceChange(Number(e.target.value))}
                aria-label="Confidence Threshold"
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-xs text-slate-500">
                Suppresses low-confidence object predictions below {(confidence * 100).toFixed(0)}% to eliminate false detections.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
