"""
Application Configuration and Settings Module
"""

import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Traffic"
    API_V1_STR: str = "/api"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./traffic_system.db")

    # Algorithm Weights
    WEIGHT_VEHICLE_COUNT: float = 0.45
    WEIGHT_QUEUE_LENGTH: float = 0.30
    WEIGHT_WAITING_TIME: float = 0.25

    # Timings
    MIN_GREEN_DURATION: int = 10
    MAX_GREEN_DURATION: int = 60
    YELLOW_DURATION: int = 3
    ALL_RED_DURATION: int = 2
    FIXED_GREEN_DURATION: int = 30

    # Vision
    CONFIDENCE_THRESHOLD: float = 0.50
    YOLO_MODEL_PATH: str = "yolov8n.pt"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "*"]

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
