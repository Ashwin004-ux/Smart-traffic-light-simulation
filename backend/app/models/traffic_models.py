"""
SQLAlchemy Database Models for Traffic Simulation & Vehicle Detections
Matches Section 6 Database Design specification.
"""

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Boolean,
    Index,
)
from sqlalchemy.orm import relationship
from app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SimulationSession(Base):
    __tablename__ = "simulation_sessions"

    id = Column(String(64), primary_key=True, index=True)
    scenario = Column(String(50), nullable=False)
    controller_type = Column(String(50), nullable=False, default="adaptive")
    status = Column(String(20), nullable=False, default="running")
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)

    traffic_records = relationship("TrafficRecord", back_populates="session", cascade="all, delete-orphan")
    vehicle_detections = relationship("VehicleDetection", back_populates="session", cascade="all, delete-orphan")
    signal_events = relationship("SignalEvent", back_populates="session", cascade="all, delete-orphan")
    metrics = relationship("SimulationMetric", back_populates="session", cascade="all, delete-orphan")


class TrafficRecord(Base):
    __tablename__ = "traffic_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("simulation_sessions.id"), nullable=False)
    direction = Column(String(10), nullable=False)
    vehicle_count = Column(Integer, default=0)
    density = Column(Float, default=0.0)
    queue_length = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    session = relationship("SimulationSession", back_populates="traffic_records")


class VehicleDetection(Base):
    __tablename__ = "vehicle_detections"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("simulation_sessions.id"), nullable=False)
    vehicle_id = Column(Integer, nullable=False)
    vehicle_type = Column(String(30), nullable=False)
    direction = Column(String(10), nullable=False)
    confidence = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    session = relationship("SimulationSession", back_populates="vehicle_detections")


class SignalEvent(Base):
    __tablename__ = "signal_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("simulation_sessions.id"), nullable=False)
    direction = Column(String(10), nullable=False)
    signal_state = Column(String(20), nullable=False)
    duration = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    session = relationship("SimulationSession", back_populates="signal_events")


class SimulationMetric(Base):
    __tablename__ = "simulation_metrics"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("simulation_sessions.id"), nullable=False)
    average_waiting_time = Column(Float, default=0.0)
    average_queue_length = Column(Float, default=0.0)
    throughput = Column(Float, default=0.0)
    clearance_time = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("SimulationSession", back_populates="metrics")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String(100), unique=True, nullable=False)
    setting_value = Column(String(255), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Indexes for rapid query performance
Index("idx_traffic_records_session_ts", TrafficRecord.session_id, TrafficRecord.timestamp)
Index("idx_detections_session_ts", VehicleDetection.session_id, VehicleDetection.timestamp)
