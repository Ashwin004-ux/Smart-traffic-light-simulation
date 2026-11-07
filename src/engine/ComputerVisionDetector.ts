/**
 * Computer Vision Detection & Tracking Engine
 * Simulates YOLOv8 Object Detection and Centroid/SORT Multi-Object Tracking.
 * Features:
 * - Frame extraction & processing
 * - Object classification & bounding box overlay
 * - Persistent Track IDs to avoid double-counting
 * - Virtual tripwire / counting lines per direction
 * - High-speed synthetic video feed generator or real HTML5 video processor
 */

import { DetectedVehicle, DetectionStats, Direction, VehicleType } from '../types/traffic';

export interface CountingLine {
  id: string;
  name: string;
  direction: Direction;
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  color: string;
  count: number;
}

export class ComputerVisionDetector {
  private confidenceThreshold: number = 0.50;
  private activeTracks: Map<number, DetectedVehicle> = new Map();
  private nextTrackId: number = 101;
  private isProcessing: boolean = true;
  private frameCount: number = 0;
  private lastFpsTimestamp: number = performance.now();
  private currentFps: number = 30;
  private latencyMs: number = 18;

  // Counts
  private totalCount: number = 0;
  private countByDirection: Record<Direction, number> = {
    north: 0,
    south: 0,
    east: 0,
    west: 0,
  };
  private countByType: Record<VehicleType, number> = {
    car: 0,
    motorcycle: 0,
    bus: 0,
    truck: 0,
    emergency: 0,
  };

  // Virtual Counting Lines in normalized 640x360 camera space
  public countingLines: CountingLine[] = [
    {
      id: 'line-north',
      name: 'North Inbound',
      direction: 'north',
      p1: { x: 260, y: 110 },
      p2: { x: 380, y: 110 },
      color: '#3b82f6',
      count: 0,
    },
    {
      id: 'line-south',
      name: 'South Inbound',
      direction: 'south',
      p1: { x: 260, y: 260 },
      p2: { x: 380, y: 260 },
      color: '#10b981',
      count: 0,
    },
    {
      id: 'line-east',
      name: 'East Inbound',
      direction: 'east',
      p1: { x: 440, y: 140 },
      p2: { x: 440, y: 220 },
      color: '#f59e0b',
      count: 0,
    },
    {
      id: 'line-west',
      name: 'West Inbound',
      direction: 'west',
      p1: { x: 200, y: 140 },
      p2: { x: 200, y: 220 },
      color: '#ef4444',
      count: 0,
    },
  ];

  // Synthetic camera vehicles
  private syntheticVehicles: Array<{
    id: number;
    type: VehicleType;
    x: number;
    y: number;
    vx: number;
    vy: number;
    w: number;
    h: number;
    confidence: number;
    direction: Direction;
    color: string;
  }> = [];

  constructor(threshold = 0.50) {
    this.confidenceThreshold = threshold;
    this.initSyntheticVehicles();
  }

  public setConfidenceThreshold(val: number) {
    this.confidenceThreshold = Math.max(0.1, Math.min(0.99, val));
  }

  public getConfidenceThreshold(): number {
    return this.confidenceThreshold;
  }

  public toggleProcessing(): boolean {
    this.isProcessing = !this.isProcessing;
    return this.isProcessing;
  }

  public getIsProcessing(): boolean {
    return this.isProcessing;
  }

  public reset() {
    this.activeTracks.clear();
    this.totalCount = 0;
    this.countByDirection = { north: 0, south: 0, east: 0, west: 0 };
    this.countByType = { car: 0, motorcycle: 0, bus: 0, truck: 0, emergency: 0 };
    this.countingLines.forEach((l) => (l.count = 0));
    this.initSyntheticVehicles();
  }

  private initSyntheticVehicles() {
    this.syntheticVehicles = [
      { id: 101, type: 'car', x: 270, y: 40, vx: 0, vy: 2.2, w: 36, h: 52, confidence: 0.94, direction: 'north', color: '#3b82f6' },
      { id: 102, type: 'truck', x: 340, y: 310, vx: 0, vy: -1.8, w: 42, h: 68, confidence: 0.89, direction: 'south', color: '#f59e0b' },
      { id: 103, type: 'bus', x: 50, y: 175, vx: 2.5, vy: 0, w: 72, h: 38, confidence: 0.92, direction: 'west', color: '#6366f1' },
      { id: 104, type: 'car', x: 560, y: 145, vx: -2.8, vy: 0, w: 50, h: 34, confidence: 0.86, direction: 'east', color: '#10b981' },
      { id: 105, type: 'motorcycle', x: 300, y: 80, vx: 0, vy: 3.0, w: 22, h: 35, confidence: 0.81, direction: 'north', color: '#ec4899' },
    ];
  }

  /**
   * Generates a realistic synthetic CCTV camera frame onto canvas
   */
  public renderCameraFeed(ctx: CanvasRenderingContext2D, width: number, height: number, showBoxes: boolean) {
    const scaleX = width / 640;
    const scaleY = height / 360;

    // 1. Draw Asphalt Ground
    ctx.fillStyle = '#1e293b'; // dark asphalt
    ctx.fillRect(0, 0, width, height);

    // 2. Road Markings (Intersection layout)
    ctx.fillStyle = '#334155';
    // Vertical Road
    ctx.fillRect(240 * scaleX, 0, 160 * scaleX, height);
    // Horizontal Road
    ctx.fillRect(0, 120 * scaleY, width, 120 * scaleY);

    // Center Junction Box
    ctx.fillStyle = '#293548';
    ctx.fillRect(240 * scaleX, 120 * scaleY, 160 * scaleX, 120 * scaleY);

    // Lane Dividers (Dashed yellow/white)
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);

    // Vertical Center Line
    ctx.beginPath();
    ctx.moveTo(320 * scaleX, 0);
    ctx.lineTo(320 * scaleX, 120 * scaleY);
    ctx.moveTo(320 * scaleX, 240 * scaleY);
    ctx.lineTo(320 * scaleX, height);
    ctx.stroke();

    // Horizontal Center Line
    ctx.beginPath();
    ctx.moveTo(0, 180 * scaleY);
    ctx.lineTo(240 * scaleX, 180 * scaleY);
    ctx.moveTo(400 * scaleX, 180 * scaleY);
    ctx.lineTo(width, 180 * scaleY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Stop Lines (Solid White)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    // North stop
    ctx.beginPath();
    ctx.moveTo(240 * scaleX, 115 * scaleY);
    ctx.lineTo(320 * scaleX, 115 * scaleY);
    ctx.stroke();
    // South stop
    ctx.beginPath();
    ctx.moveTo(320 * scaleX, 245 * scaleY);
    ctx.lineTo(400 * scaleX, 245 * scaleY);
    ctx.stroke();
    // West stop
    ctx.beginPath();
    ctx.moveTo(235 * scaleX, 180 * scaleY);
    ctx.lineTo(235 * scaleX, 240 * scaleY);
    ctx.stroke();
    // East stop
    ctx.beginPath();
    ctx.moveTo(405 * scaleX, 120 * scaleY);
    ctx.lineTo(405 * scaleX, 180 * scaleY);
    ctx.stroke();

    // 3. Draw Virtual Counting Lines
    for (const line of this.countingLines) {
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(line.p1.x * scaleX, line.p1.y * scaleY);
      ctx.lineTo(line.p2.x * scaleX, line.p2.y * scaleY);
      ctx.stroke();

      // Label badge
      ctx.fillStyle = line.color;
      ctx.font = '10px monospace';
      ctx.fillText(`${line.name} [${line.count}]`, (line.p1.x + 4) * scaleX, (line.p1.y - 6) * scaleY);
    }

    // 4. Update and Render Vehicles
    if (this.isProcessing) {
      for (const v of this.syntheticVehicles) {
        v.x += v.vx;
        v.y += v.vy;

        // Wrap around when leaving frame
        if (v.y > 380) { v.y = -60; v.confidence = 0.85 + Math.random() * 0.12; }
        if (v.y < -80) { v.y = 370; v.confidence = 0.86 + Math.random() * 0.11; }
        if (v.x > 660) { v.x = -80; v.confidence = 0.88 + Math.random() * 0.10; }
        if (v.x < -100) { v.x = 650; v.confidence = 0.84 + Math.random() * 0.13; }

        // Check line crossing for virtual tripwires
        this.checkLineCrossing(v);
      }
    }

    // Draw Vehicle Bodies (simulated camera object)
    for (const v of this.syntheticVehicles) {
      const vx = v.x * scaleX;
      const vy = v.y * scaleY;
      const vw = v.w * scaleX;
      const vh = v.h * scaleY;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(vx + 3, vy + 4, vw, vh);

      // Vehicle Chassis
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.roundRect(vx, vy, vw, vh, 4);
      ctx.fill();

      // Windshield & Roof
      ctx.fillStyle = '#0f172a';
      if (v.w < v.h) {
        // Vertical vehicle
        ctx.fillRect(vx + 3, vy + 10, vw - 6, 8);
        ctx.fillRect(vx + 3, vy + vh - 14, vw - 6, 6);
      } else {
        // Horizontal vehicle
        ctx.fillRect(vx + 10, vy + 3, 8, vh - 6);
        ctx.fillRect(vx + vw - 14, vy + 3, 6, vh - 6);
      }

      // 5. Draw YOLO Bounding Box and Label if enabled & above threshold
      if (showBoxes && v.confidence >= this.confidenceThreshold) {
        const boxPad = 4;
        const bx = vx - boxPad;
        const by = vy - boxPad;
        const bw = vw + boxPad * 2;
        const bh = vh + boxPad * 2;

        ctx.strokeStyle = '#22c55e'; // neon green detection box
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        // Corner accents
        ctx.lineWidth = 3;
        const cLen = 6;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(bx, by + cLen); ctx.lineTo(bx, by); ctx.lineTo(bx + cLen, by);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(bx + bw - cLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cLen);
        ctx.stroke();

        // Label Tag
        const label = `#${v.id} ${v.type.toUpperCase()} ${(v.confidence * 100).toFixed(0)}%`;
        ctx.font = '11px sans-serif';
        const textWidth = ctx.measureText(label).width;

        ctx.fillStyle = '#22c55e';
        ctx.fillRect(bx, by - 18, textWidth + 8, 18);
        ctx.fillStyle = '#000000';
        ctx.fillText(label, bx + 4, by - 5);

        // Centroid point
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(vx + vw / 2, vy + vh / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 6. Camera OSD (On-Screen Display)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(10, 10, 240, 52);
    ctx.fillStyle = '#00ff66';
    ctx.font = '11px monospace';
    const now = new Date();
    ctx.fillText(`CAM-04 [TRAFFIC INTR-NW]`, 18, 26);
    ctx.fillText(`${now.toISOString().slice(0, 19).replace('T', ' ')} UTC`, 18, 40);
    ctx.fillText(`FPS: ${this.currentFps} | LATENCY: ${this.latencyMs}ms`, 18, 54);

    // Update FPS calculation
    this.frameCount++;
    const nowPerf = performance.now();
    if (nowPerf - this.lastFpsTimestamp >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (nowPerf - this.lastFpsTimestamp));
      this.frameCount = 0;
      this.lastFpsTimestamp = nowPerf;
      this.latencyMs = Math.round(15 + Math.random() * 6);
    }
  }

  /**
   * Check if vehicle centroid crossed virtual tripwire lines
   */
  private checkLineCrossing(v: { id: number; type: VehicleType; x: number; y: number; w: number; h: number; direction: Direction }) {
    const cx = v.x + v.w / 2;
    const cy = v.y + v.h / 2;

    for (const line of this.countingLines) {
      if (line.direction === v.direction) {
        // Check proximity to line
        let crossed = false;
        if (line.direction === 'north' && Math.abs(cy - line.p1.y) < 2 && cx >= line.p1.x && cx <= line.p2.x) {
          crossed = true;
        } else if (line.direction === 'south' && Math.abs(cy - line.p1.y) < 2 && cx >= line.p1.x && cx <= line.p2.x) {
          crossed = true;
        } else if (line.direction === 'east' && Math.abs(cx - line.p1.x) < 2 && cy >= line.p1.y && cy <= line.p2.y) {
          crossed = true;
        } else if (line.direction === 'west' && Math.abs(cx - line.p1.x) < 2 && cy >= line.p1.y && cy <= line.p2.y) {
          crossed = true;
        }

        if (crossed && !this.activeTracks.has(v.id)) {
          line.count++;
          this.totalCount++;
          this.countByDirection[line.direction]++;
          this.countByType[v.type]++;

          this.activeTracks.set(v.id, {
            trackId: v.id,
            type: v.type,
            confidence: 0.90,
            bbox: [v.x, v.y, v.w, v.h],
            direction: line.direction,
            speedKmH: Math.round(35 + Math.random() * 15),
            firstSeen: Date.now(),
            lastSeen: Date.now(),
            counted: true,
          });

          // Limit track memory
          if (this.activeTracks.size > 200) {
            const firstKey = this.activeTracks.keys().next().value;
            if (firstKey !== undefined) this.activeTracks.delete(firstKey);
          }
        }
      }
    }
  }

  public getStats(): DetectionStats {
    return {
      fps: this.currentFps,
      latencyMs: this.latencyMs,
      totalDetections: this.totalCount,
      activeTracks: this.syntheticVehicles.filter(v => v.confidence >= this.confidenceThreshold).length,
      countByDirection: { ...this.countByDirection },
      countByType: { ...this.countByType },
    };
  }

  public getActiveTracks(): DetectedVehicle[] {
    return Array.from(this.activeTracks.values());
  }
}
