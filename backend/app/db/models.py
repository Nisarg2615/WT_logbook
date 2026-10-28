from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), index=True)
    role = Column(String(50)) # Operator, Supervisor, Manager
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(100))

class Equipment(Base):
    __tablename__ = "equipment"
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String(50), unique=True, index=True)
    name = Column(String(100))
    type = Column(String(50))
    section = Column(String(50))
    status = Column(String(50)) # Operational, Warning, Maintenance, Offline
    
    parameters = relationship("EquipmentParameter", back_populates="equipment")
    logbooks = relationship("LogbookEntry", back_populates="equipment")
    alerts = relationship("Alert", back_populates="equipment")

class EquipmentParameter(Base):
    __tablename__ = "equipment_parameters"
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"))
    parameter_name = Column(String(50))
    unit = Column(String(20))
    min_normal = Column(Float, nullable=True)
    max_normal = Column(Float, nullable=True)
    min_warning = Column(Float, nullable=True)
    max_warning = Column(Float, nullable=True)
    critical_threshold = Column(Float, nullable=True)
    
    equipment = relationship("Equipment", back_populates="parameters")

class LogbookEntry(Base):
    __tablename__ = "logbook_entries"
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"))
    operator_id = Column(Integer, ForeignKey("users.id"))
    shift = Column(String(20))
    status = Column(String(50)) # Draft, Submitted, Approved, Rejected
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    data = Column(JSON) # Stores key-value readings
    supervisor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    supervisor_comments = Column(String(500), nullable=True)
    
    equipment = relationship("Equipment", back_populates="logbooks")
    operator = relationship("User", foreign_keys=[operator_id])
    supervisor = relationship("User", foreign_keys=[supervisor_id])

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"))
    parameter = Column(String(50))
    reading = Column(Float)
    threshold = Column(Float)
    severity = Column(String(20)) # Warning, Critical
    status = Column(String(20)) # Open, Acknowledged
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    equipment = relationship("Equipment", back_populates="alerts")

class ShiftHandover(Base):
    __tablename__ = "shift_handovers"
    id = Column(Integer, primary_key=True, index=True)
    section = Column(String(50)) # Using section string for simplicity
    outgoing_user_id = Column(Integer, ForeignKey("users.id"))
    incoming_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    entries_count = Column(Integer, default=0)
    anomaly_count = Column(Integer, default=0)
    unresolved_alerts_json = Column(JSON, nullable=True)
    notes = Column(String(500), nullable=True)
    status = Column(String(50)) # pending, acknowledged
    outgoing_signed_at = Column(DateTime, nullable=True)
    incoming_signed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    outgoing_user = relationship("User", foreign_keys=[outgoing_user_id])
    incoming_user = relationship("User", foreign_keys=[incoming_user_id])

class Signature(Base):
    __tablename__ = "signatures"
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50)) # log_entry, handover, alert
    entity_id = Column(Integer)
    user_id = Column(Integer, ForeignKey("users.id"))
    user_role = Column(String(50))
    meaning = Column(String(50)) # author, reviewer, approver, handover_outgoing, handover_incoming
    signed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_role = Column(String(50), nullable=True)
    action = Column(String(100))
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    description = Column(String(255))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
