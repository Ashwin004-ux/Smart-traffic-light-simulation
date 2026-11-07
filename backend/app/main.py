"""
FastAPI Main Application Entrypoint
Provides REST endpoints, WebSockets for live telemetry, and Swagger UI.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import json
import asyncio

from app.core.config import settings
from app.database.connection import engine, Base
from app.algorithms.adaptive_controller import AdaptiveSignalControllerPy
from app.detection.yolo_detector import TrafficVideoDetector
from app.schemas.traffic_schemas import SettingsSchema

# Create tables if not exists
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Traffic Management System with Adaptive Signal Control & Computer Vision Detection",
    version="2.4.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory controllers for fast state serving
adaptive_controller = AdaptiveSignalControllerPy(
    weight_count=settings.WEIGHT_VEHICLE_COUNT,
    weight_queue=settings.WEIGHT_QUEUE_LENGTH,
    weight_wait=settings.WEIGHT_WAITING_TIME,
    min_green=settings.MIN_GREEN_DURATION,
    max_green=settings.MAX_GREEN_DURATION,
    yellow=settings.YELLOW_DURATION,
    all_red=settings.ALL_RED_DURATION,
)
video_detector = TrafficVideoDetector(confidence_threshold=settings.CONFIDENCE_THRESHOLD)

# Connected WebSocket clients
connected_clients: List[WebSocket] = []


@app.get("/")
def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
    }


# Simulation Endpoints
@app.post(f"{settings.API_V1_STR}/simulation/start")
def start_simulation():
    return {"status": "started", "message": "Simulation running"}


@app.post(f"{settings.API_V1_STR}/simulation/pause")
def pause_simulation():
    return {"status": "paused", "message": "Simulation paused"}


@app.post(f"{settings.API_V1_STR}/simulation/reset")
def reset_simulation():
    return {"status": "reset", "message": "Simulation reset to initial state"}


@app.get(f"{settings.API_V1_STR}/traffic/current")
def get_current_traffic():
    signals = adaptive_controller.get_signals()
    return {
        "phase": adaptive_controller.current_phase,
        "phase_state": adaptive_controller.phase_state,
        "time_remaining": adaptive_controller.time_remaining,
        "signals": signals,
    }


@app.get(f"{settings.API_V1_STR}/settings")
def get_settings():
    return {
        "weight_vehicle_count": adaptive_controller.w1,
        "weight_queue_length": adaptive_controller.w2,
        "weight_waiting_time": adaptive_controller.w3,
        "min_green_duration": adaptive_controller.min_green,
        "max_green_duration": adaptive_controller.max_green,
        "yellow_duration": adaptive_controller.yellow,
        "all_red_duration": adaptive_controller.all_red,
        "emergency_priority": True,
        "confidence_threshold": video_detector.confidence_threshold,
    }


@app.put(f"{settings.API_V1_STR}/settings")
def update_settings(new_settings: SettingsSchema):
    adaptive_controller.w1 = new_settings.weight_vehicle_count
    adaptive_controller.w2 = new_settings.weight_queue_length
    adaptive_controller.w3 = new_settings.weight_waiting_time
    adaptive_controller.min_green = new_settings.min_green_duration
    adaptive_controller.max_green = new_settings.max_green_duration
    adaptive_controller.yellow = new_settings.yellow_duration
    adaptive_controller.all_red = new_settings.all_red_duration
    video_detector.confidence_threshold = new_settings.confidence_threshold
    return {"status": "updated", "settings": new_settings}


# Real-time WebSocket Endpoint
@app.websocket("/ws/traffic")
async def websocket_traffic_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            # Stream simulation updates at 10Hz
            data = {
                "phase": adaptive_controller.current_phase,
                "state": adaptive_controller.phase_state,
                "time_remaining": round(adaptive_controller.time_remaining, 1),
                "signals": adaptive_controller.get_signals(),
            }
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
