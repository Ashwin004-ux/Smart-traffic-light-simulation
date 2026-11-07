/**
 * IntersectionCanvas Component
 * High-precision engineering rendering of a 4-way urban intersection.
 * Features realistic pavement markings, lane turn arrows, stop bars,
 * induction loop sensor cuts, hooded traffic signal visors, and vehicle kinematics.
 */

import React, { useRef, useEffect } from 'react';
import { Vehicle, SignalState, Direction } from '../../types/traffic';
import { INTERSECTION_GEOMETRY } from '../../engine/TrafficSimulationEngine';

interface IntersectionCanvasProps {
  vehicles: Vehicle[];
  signals: Record<Direction, SignalState>;
  phaseRemaining: number;
  activePhase: string;
  showDebug?: boolean;
  onSpawnVehicle?: (dir: Direction) => void;
}

export const IntersectionCanvas: React.FC<IntersectionCanvasProps> = ({
  vehicles,
  signals,
  phaseRemaining,
  activePhase,
  showDebug = false,
  onSpawnVehicle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = INTERSECTION_GEOMETRY.CANVAS_SIZE; // 600
    const center = INTERSECTION_GEOMETRY.CENTER; // 300
    const roadWidth = INTERSECTION_GEOMETRY.ROAD_WIDTH; // 120
    const halfRoad = roadWidth / 2; // 60
    const laneWidth = INTERSECTION_GEOMETRY.LANE_WIDTH; // 30
    const stopLineDist = INTERSECTION_GEOMETRY.STOP_LINE_OFFSET; // 65

    ctx.clearRect(0, 0, size, size);

    // 1. Terrain / Concrete sidewalks & roadside vegetation
    ctx.fillStyle = '#e2e8f0'; // clean concrete pavement
    ctx.fillRect(0, 0, size, size);

    // Corner sidewalks with subtle curb texture
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, center - halfRoad - 6, center - halfRoad - 6);
    ctx.fillRect(center + halfRoad + 6, 0, size, center - halfRoad - 6);
    ctx.fillRect(0, center + halfRoad + 6, center - halfRoad - 6, size);
    ctx.fillRect(center + halfRoad + 6, center + halfRoad + 6, size, size);

    // 2. Road Pavement (Authentic Weathered Asphalt)
    ctx.fillStyle = '#1e2430';
    // Vertical corridor
    ctx.fillRect(center - halfRoad, 0, roadWidth, size);
    // Horizontal corridor
    ctx.fillRect(0, center - halfRoad, size, roadWidth);

    // Curbs and gutters
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(0, 0, center - halfRoad, center - halfRoad);
    ctx.strokeRect(center + halfRoad, 0, size - center - halfRoad, center - halfRoad);
    ctx.strokeRect(0, center + halfRoad, center - halfRoad, size - center - halfRoad);
    ctx.strokeRect(center + halfRoad, center + halfRoad, size - center - halfRoad, size - center - halfRoad);

    // 3. Center Junction Box
    ctx.fillStyle = '#252c3b';
    ctx.fillRect(center - halfRoad, center - halfRoad, roadWidth, roadWidth);

    // Subtle yellow intersection grid ("Keep Clear" box marking)
    ctx.save();
    ctx.beginPath();
    ctx.rect(center - halfRoad, center - halfRoad, roadWidth, roadWidth);
    ctx.clip();
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.22)';
    ctx.lineWidth = 1.5;
    for (let offset = -roadWidth; offset < roadWidth * 2; offset += 18) {
      ctx.beginPath();
      ctx.moveTo(center - halfRoad + offset, center - halfRoad);
      ctx.lineTo(center + halfRoad + offset, center + halfRoad);
      ctx.stroke();
    }
    ctx.restore();

    // 4. Pedestrian Crosswalks (Crisp Zebra Crossings)
    const drawCrosswalk = (x1: number, y1: number, w: number, h: number, horizontal: boolean) => {
      ctx.fillStyle = '#ffffff';
      const stripeCount = 7;
      if (horizontal) {
        const stripeW = w / (stripeCount * 2);
        for (let i = 0; i < stripeCount; i++) {
          ctx.fillRect(x1 + i * stripeW * 2, y1, stripeW, h);
        }
      } else {
        const stripeH = h / (stripeCount * 2);
        for (let i = 0; i < stripeCount; i++) {
          ctx.fillRect(x1, y1 + i * stripeH * 2, w, stripeH);
        }
      }
    };

    drawCrosswalk(center - halfRoad, center - halfRoad - 20, roadWidth, 14, true); // North
    drawCrosswalk(center - halfRoad, center + halfRoad + 6, roadWidth, 14, true); // South
    drawCrosswalk(center - halfRoad - 20, center - halfRoad, 14, roadWidth, false); // West
    drawCrosswalk(center + halfRoad + 6, center - halfRoad, 14, roadWidth, false); // East

    // 5. Pavement Sensor Cuts (Inductive Loop detector lines)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1;
    // North loops
    ctx.strokeRect(center + 5, center - stopLineDist - 25, 20, 15);
    ctx.strokeRect(center + 35, center - stopLineDist - 25, 20, 15);
    // South loops
    ctx.strokeRect(center - 25, center + stopLineDist + 10, 20, 15);
    ctx.strokeRect(center - 55, center + stopLineDist + 10, 20, 15);
    // West loops
    ctx.strokeRect(center - stopLineDist - 25, center + 5, 15, 20);
    ctx.strokeRect(center - stopLineDist - 25, center + 35, 15, 20);
    // East loops
    ctx.strokeRect(center + stopLineDist + 10, center - 25, 15, 20);
    ctx.strokeRect(center + stopLineDist + 10, center - 55, 15, 20);

    // 6. Road Lane Dividing Markings
    // Double Yellow Centerline
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;

    // North
    ctx.beginPath();
    ctx.moveTo(center - 1.5, 0); ctx.lineTo(center - 1.5, center - halfRoad - 22);
    ctx.moveTo(center + 1.5, 0); ctx.lineTo(center + 1.5, center - halfRoad - 22);
    ctx.stroke();

    // South
    ctx.beginPath();
    ctx.moveTo(center - 1.5, center + halfRoad + 22); ctx.lineTo(center - 1.5, size);
    ctx.moveTo(center + 1.5, center + halfRoad + 22); ctx.lineTo(center + 1.5, size);
    ctx.stroke();

    // West
    ctx.beginPath();
    ctx.moveTo(0, center - 1.5); ctx.lineTo(center - halfRoad - 22, center - 1.5);
    ctx.moveTo(0, center + 1.5); ctx.lineTo(center - halfRoad - 22, center + 1.5);
    ctx.stroke();

    // East
    ctx.beginPath();
    ctx.moveTo(center + halfRoad + 22, center - 1.5); ctx.lineTo(size, center - 1.5);
    ctx.moveTo(center + halfRoad + 22, center + 1.5); ctx.lineTo(size, center + 1.5);
    ctx.stroke();

    // White Dashed Lane Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([10, 12]);

    // North dividers
    ctx.beginPath();
    ctx.moveTo(center - halfRoad + laneWidth, 0); ctx.lineTo(center - halfRoad + laneWidth, center - halfRoad - 22);
    ctx.moveTo(center + halfRoad - laneWidth, 0); ctx.lineTo(center + halfRoad - laneWidth, center - halfRoad - 22);
    ctx.stroke();

    // South dividers
    ctx.beginPath();
    ctx.moveTo(center - halfRoad + laneWidth, center + halfRoad + 22); ctx.lineTo(center - halfRoad + laneWidth, size);
    ctx.moveTo(center + halfRoad - laneWidth, center + halfRoad + 22); ctx.lineTo(center + halfRoad - laneWidth, size);
    ctx.stroke();

    // West dividers
    ctx.beginPath();
    ctx.moveTo(0, center - halfRoad + laneWidth); ctx.lineTo(center - halfRoad - 22, center - halfRoad + laneWidth);
    ctx.moveTo(0, center + halfRoad - laneWidth); ctx.lineTo(center - halfRoad - 22, center + halfRoad - laneWidth);
    ctx.stroke();

    // East dividers
    ctx.beginPath();
    ctx.moveTo(center + halfRoad + 22, center - halfRoad + laneWidth); ctx.lineTo(size, center - halfRoad + laneWidth);
    ctx.moveTo(center + halfRoad + 22, center + halfRoad - laneWidth); ctx.lineTo(size, center + halfRoad - laneWidth);
    ctx.stroke();
    ctx.setLineDash([]);

    // Solid Stop Line Bars (White bar before crosswalk)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    // North
    ctx.beginPath();
    ctx.moveTo(center, center - stopLineDist);
    ctx.lineTo(center + halfRoad, center - stopLineDist);
    ctx.stroke();
    // South
    ctx.beginPath();
    ctx.moveTo(center - halfRoad, center + stopLineDist);
    ctx.lineTo(center, center + stopLineDist);
    ctx.stroke();
    // West
    ctx.beginPath();
    ctx.moveTo(center - stopLineDist, center);
    ctx.lineTo(center - stopLineDist, center + halfRoad);
    ctx.stroke();
    // East
    ctx.beginPath();
    ctx.moveTo(center + stopLineDist, center - halfRoad);
    ctx.lineTo(center + stopLineDist, center);
    ctx.stroke();

    // 7. Pavement Lane Direction Arrows
    const drawPavementArrow = (x: number, y: number, angle: number, isTurn: boolean) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      // Stem
      ctx.fillRect(-2, -10, 4, 16);
      // Arrowhead
      ctx.moveTo(-6, -10);
      ctx.lineTo(0, -18);
      ctx.lineTo(6, -10);
      ctx.closePath();
      ctx.fill();

      if (isTurn) {
        // Left branch
        ctx.beginPath();
        ctx.arc(-8, -4, 6, 0, Math.PI / 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.stroke();
      }
      ctx.restore();
    };

    // North approach lane arrows
    drawPavementArrow(center + 15, center - stopLineDist - 45, Math.PI, true); // Inner turn lane
    drawPavementArrow(center + 45, center - stopLineDist - 45, Math.PI, false); // Outer straight lane
    // South approach lane arrows
    drawPavementArrow(center - 15, center + stopLineDist + 45, 0, true);
    drawPavementArrow(center - 45, center + stopLineDist + 45, 0, false);
    // West approach lane arrows
    drawPavementArrow(center - stopLineDist - 45, center + 15, Math.PI / 2, true);
    drawPavementArrow(center - stopLineDist - 45, center + 45, Math.PI / 2, false);
    // East approach lane arrows
    drawPavementArrow(center + stopLineDist + 45, center - 15, -Math.PI / 2, true);
    drawPavementArrow(center + stopLineDist + 45, center - 45, -Math.PI / 2, false);

    // 8. Approach Direction Labels
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NORTHBOUND (NB)', center + 30, 16);
    ctx.fillText('SOUTHBOUND (SB)', center - 30, size - 12);
    ctx.save();
    ctx.translate(16, center + 30);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('WESTBOUND (WB)', 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(size - 16, center - 30);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('EASTBOUND (EB)', 0, 0);
    ctx.restore();

    // 9. Vehicles Rendering
    const nowTime = Date.now();
    for (const v of vehicles) {
      let vx = 0;
      let vy = 0;
      let heading = 0;

      if (v.direction === 'north') {
        const laneOffset = v.lane === 0 ? 15 : 45;
        vx = center + laneOffset;
        vy = v.position;
        heading = Math.PI / 2;
      } else if (v.direction === 'south') {
        const laneOffset = v.lane === 0 ? -15 : -45;
        vx = center + laneOffset;
        vy = size - v.position;
        heading = -Math.PI / 2;
      } else if (v.direction === 'west') {
        const laneOffset = v.lane === 0 ? 15 : 45;
        vx = v.position;
        vy = center + laneOffset;
        heading = 0;
      } else if (v.direction === 'east') {
        const laneOffset = v.lane === 0 ? -15 : -45;
        vx = size - v.position;
        vy = center + laneOffset;
        heading = Math.PI;
      }

      ctx.save();
      ctx.translate(vx, vy);
      ctx.rotate(heading);

      const hw = v.length / 2;
      const hh = v.width / 2;

      // Realistic Vehicle Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(-hw + 2, -hh + 2, v.length, v.width, 3);
      ctx.fill();

      // Vehicle Chassis
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.roundRect(-hw, -hh, v.length, v.width, 3);
      ctx.fill();

      // Vehicle Roof & Glass
      ctx.fillStyle = '#0f172a';
      if (v.type === 'car' || v.type === 'emergency') {
        ctx.fillRect(hw - 9, -hh + 2, 4, v.width - 4); // Front windshield
        ctx.fillRect(-hw + 5, -hh + 2, 3, v.width - 4); // Rear window
      } else if (v.type === 'bus' || v.type === 'truck') {
        ctx.fillRect(hw - 6, -hh + 2, 3, v.width - 4);
      }

      // Headlights
      ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
      ctx.fillRect(hw - 1, -hh + 1, 2, 2.5);
      ctx.fillRect(hw - 1, hh - 3.5, 2, 2.5);

      // Brake Lights (glowing bright red when stopped or decelerating)
      if (v.isWaiting || v.speed < 15) {
        ctx.fillStyle = '#ff0033';
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 6;
        ctx.fillRect(-hw - 1, -hh + 1, 2, 3);
        ctx.fillRect(-hw - 1, hh - 4, 2, 3);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-hw - 1, -hh + 1, 1.5, 2.5);
        ctx.fillRect(-hw - 1, hh - 3.5, 1.5, 2.5);
      }

      // Emergency flashing light bar
      if (v.type === 'emergency') {
        const strobe = Math.floor((nowTime / 160) % 2);
        ctx.shadowBlur = 10;
        ctx.shadowColor = strobe === 0 ? '#ef4444' : '#3b82f6';
        ctx.fillStyle = strobe === 0 ? '#ef4444' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (showDebug && v.waitingTime > 2) {
        ctx.rotate(-heading);
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`${v.waitingTime.toFixed(0)}s`, 0, -hh - 4);
      }

      ctx.restore();
    }

    // 10. Hooded Traffic Signal Heads with Realistic Visors
    const drawSignalHead = (x: number, y: number, state: SignalState, dir: Direction) => {
      // Dark Signal Housing
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(x - 9, y - 22, 18, 44, 4);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();

      const drawLEDAspect = (cy: number, color: string, active: boolean, glow: string) => {
        // Sun Visor / Hood above lens
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(x, cy - 1, 6, Math.PI, 0, false);
        ctx.fill();

        ctx.save();
        if (active) {
          ctx.fillStyle = color;
          ctx.shadowColor = glow;
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = '#1e2430'; // inactive lens
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.arc(x, cy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      const isRed = state === 'RED' || state === 'ALL_RED';
      const isYellow = state === 'YELLOW';
      const isGreen = state === 'GREEN';

      // Red (top)
      drawLEDAspect(y - 13, '#ef4444', isRed, 'rgba(239, 68, 68, 0.9)');
      // Yellow (middle)
      drawLEDAspect(y, '#eab308', isYellow, 'rgba(234, 179, 8, 0.9)');
      // Green (bottom)
      drawLEDAspect(y + 13, '#10b981', isGreen, 'rgba(16, 185, 129, 0.9)');
    };

    // Position signal heads at corners
    drawSignalHead(center + halfRoad + 16, center - halfRoad - 28, signals.north, 'north');
    drawSignalHead(center - halfRoad - 16, center + halfRoad + 28, signals.south, 'south');
    drawSignalHead(center - halfRoad - 28, center - halfRoad - 16, signals.west, 'west');
    drawSignalHead(center + halfRoad + 28, center + halfRoad + 16, signals.east, 'east');

    // Countdown timers
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    const countdown = Math.max(0, Math.ceil(phaseRemaining));

    ctx.fillText(`${countdown}s`, center + halfRoad + 16, center - halfRoad - 42);
    ctx.fillText(`${countdown}s`, center - halfRoad - 16, center + halfRoad + 48);
    ctx.fillText(`${countdown}s`, center - halfRoad - 28, center - halfRoad - 30);
    ctx.fillText(`${countdown}s`, center + halfRoad + 28, center + halfRoad + 36);

  }, [vehicles, signals, phaseRemaining, activePhase, showDebug]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative border border-slate-300 rounded-lg overflow-hidden shadow-sm bg-slate-900">
        <canvas
          ref={canvasRef}
          width={INTERSECTION_GEOMETRY.CANVAS_SIZE}
          height={INTERSECTION_GEOMETRY.CANVAS_SIZE}
          className="block cursor-crosshair"
          title="Urban Traffic Intersection CAD Viewport"
        />

        {/* Quick Spawn Buttons on Approach Margins */}
        {onSpawnVehicle && (
          <>
            <button
              onClick={() => onSpawnVehicle('north')}
              className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/90 hover:bg-slate-800 text-white text-[11px] font-medium px-2.5 py-1 rounded border border-slate-700 shadow-xs cursor-pointer transition"
              title="Inject vehicle on North Approach"
            >
              + North Entry
            </button>
            <button
              onClick={() => onSpawnVehicle('south')}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/90 hover:bg-slate-800 text-white text-[11px] font-medium px-2.5 py-1 rounded border border-slate-700 shadow-xs cursor-pointer transition"
              title="Inject vehicle on South Approach"
            >
              + South Entry
            </button>
            <button
              onClick={() => onSpawnVehicle('west')}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-slate-900/90 hover:bg-slate-800 text-white text-[11px] font-medium px-2.5 py-1 rounded border border-slate-700 shadow-xs cursor-pointer transition -rotate-90"
              title="Inject vehicle on West Approach"
            >
              + West Entry
            </button>
            <button
              onClick={() => onSpawnVehicle('east')}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900/90 hover:bg-slate-800 text-white text-[11px] font-medium px-2.5 py-1 rounded border border-slate-700 shadow-xs cursor-pointer transition rotate-90"
              title="Inject vehicle on East Approach"
            >
              + East Entry
            </button>
          </>
        )}

        {/* Clean Phase Status Bar */}
        <div className="absolute top-3 right-3 bg-slate-950/90 border border-slate-700 text-white px-3 py-1.5 rounded shadow-sm text-xs flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-slate-200">
            {activePhase === 'NORTH_SOUTH' ? 'Phase 2 & 6 (NB/SB)' : 'Phase 4 & 8 (EB/WB)'}
          </span>
          <span className="font-mono text-blue-400 font-bold">
            {Math.ceil(phaseRemaining)}s
          </span>
        </div>
      </div>
    </div>
  );
};
