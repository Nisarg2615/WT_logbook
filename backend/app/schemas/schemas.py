from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Token / Auth ---
class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

# --- Users ---
class UserBase(BaseModel):
    name: str
    role: str
    email: str

class UserSchema(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Equipment Parameters ---
class EquipmentParameterCreate(BaseModel):
    parameter_name: str
    unit: str
    min_normal: Optional[float] = None
    max_normal: Optional[float] = None
    min_warning: Optional[float] = None
    max_warning: Optional[float] = None
    critical_threshold: Optional[float] = None

class EquipmentParameterSchema(BaseModel):
    id: int
    parameter_name: str
    unit: str
    min_normal: Optional[float]
    max_normal: Optional[float]
    min_warning: Optional[float]
    max_warning: Optional[float]
    critical_threshold: Optional[float]
    model_config = ConfigDict(from_attributes=True)

# --- Equipment ---
class EquipmentCreate(BaseModel):
    equipment_id: str
    name: str
    type: str
    section: str
    status: str = "Operational"
    parameters: Optional[List[EquipmentParameterCreate]] = []

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    section: Optional[str] = None
    status: Optional[str] = None

class EquipmentSchema(BaseModel):
    id: int
    equipment_id: str
    name: str
    type: str
    section: str
    status: str
    parameters: List[EquipmentParameterSchema] = []
    model_config = ConfigDict(from_attributes=True)

# --- Logbook Entries ---
class LogbookEntryCreate(BaseModel):
    equipment_id: int
    operator_id: int
    shift: str
    status: str # Draft, Submitted
    data: Dict[str, Any]

class LogbookEntryUpdate(BaseModel):
    status: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class RejectReviewRequest(BaseModel):
    comments: Optional[str] = None

class ApproveReviewRequest(BaseModel):
    comments: Optional[str] = None

class LogbookEntrySchema(BaseModel):
    id: int
    equipment_id: int
    operator_id: int
    shift: str
    status: str
    recorded_at: datetime
    data: Dict[str, Any]
    supervisor_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    supervisor_comments: Optional[str] = None
    
    equipment: Optional[EquipmentSchema] = None
    operator: Optional[UserSchema] = None
    
    model_config = ConfigDict(from_attributes=True)

# --- Alerts ---
class AlertSchema(BaseModel):
    id: int
    equipment_id: int
    parameter: str
    reading: float
    threshold: float
    severity: str
    status: str
    created_at: datetime
    
    equipment: Optional[EquipmentSchema] = None
    
    model_config = ConfigDict(from_attributes=True)

# --- Shift Handovers ---
class ShiftHandoverSchema(BaseModel):
    id: int
    section: str
    outgoing_user_id: int
    incoming_user_id: Optional[int] = None
    entries_count: int
    anomaly_count: int
    unresolved_alerts_json: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    status: str
    outgoing_signed_at: Optional[datetime] = None
    incoming_signed_at: Optional[datetime] = None
    created_at: datetime
    outgoing_user: Optional[UserSchema] = None
    incoming_user: Optional[UserSchema] = None
    
    model_config = ConfigDict(from_attributes=True)

class ShiftHandoverCreate(BaseModel):
    section: str
    outgoing_user_id: int
    entries_count: int
    anomaly_count: int
    unresolved_alerts_json: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    status: str = "pending"

class ShiftHandoverAcknowledge(BaseModel):
    incoming_user_id: int
    status: str = "acknowledged"

# --- Signatures ---
class SignatureSchema(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    user_id: int
    user_role: str
    meaning: str
    signed_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SignatureCreate(BaseModel):
    entity_type: str
    entity_id: int
    user_id: int
    user_role: str
    meaning: str

# --- Audit Logs ---
class AuditLogSchema(BaseModel):
    id: int
    actor_user_id: Optional[int] = None
    actor_role: Optional[str] = None
    action: str
    entity_type: str
    entity_id: int
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
