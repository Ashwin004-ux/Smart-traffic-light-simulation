"""
Pydantic Schemas for Request/Response Validation
"""

from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class DirectionStatusSchema(BaseModel):
    direction: str
    vehicle_count: int
    queue_length: int
    density: float
    average_waiting_time: float
    current_signal: str
    has_emergency: bool = False


class SimulationStatusSchema(BaseModel):
    status: str
    scenario: str
    controller_type: str
    elapsed_time: float
    total_processed: int
    throughput: float
    average_waiting_time: float
    congestion_index: str
    directions: Dict[str, DirectionStatusSchema]


class SettingsSchema(BaseModel):
    weight_vehicle_count: float = Field(0.45, ge=0.0, le=1.0)
    weight_queue_length: float = Field(0.30, ge=0.0, le=1.0)
    weight_waiting_time: float = Field(0.25, ge=0.0, le=1.0)
    min_green_duration: int = Field(10, ge=5, le=30)
    max_green_duration: int = Field(60, ge=30, le=120)
    yellow_duration: int = Field(3, ge=2, le=6)
    all_red_duration: int = Field(2, ge=1, le=5)
    emergency_priority: bool = True
    confidence_threshold: float = Field(0.50, ge=0.1, le=0.99)


class DetectionResultSchema(BaseModel):
    track_id: int
    vehicle_type: str
    direction: str
    confidence: float
    bbox: List[float]
    counted: bool


class DetectionOverviewSchema(BaseModel):
    fps: float
    latency_ms: float
    total_detections: int
    active_tracks: int
    counts_by_direction: Dict[str, int]
    counts_by_type: Dict[str, int]
