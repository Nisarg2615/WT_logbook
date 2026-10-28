from app.db.session import SessionLocal, engine, Base
from app.db import models

# Ensure tables are created
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed_data():
    if db.query(models.User).count() > 0:
        print("Database already seeded")
        return

    print("Seeding Users...")
    users = [
        models.User(name="Operator Nisarg", role="Operator", email="operator@elogbook.com", password_hash="password"),
        models.User(name="Supervisor Admin", role="Supervisor", email="supervisor@elogbook.com", password_hash="password"),
        models.User(name="Plant Manager", role="Manager", email="manager@elogbook.com", password_hash="password"),
    ]
    db.bulk_save_objects(users)
    db.commit()

    print("Seeding Equipment...")
    equipments = [
        models.Equipment(equipment_id="PMP-001", name="Cooling Water Pump", type="Pump", section="Utilities", status="Operational"),
        models.Equipment(equipment_id="BLR-002", name="Steam Boiler", type="Boiler", section="Production", status="Operational"),
        models.Equipment(equipment_id="GEN-003", name="Backup Generator", type="Generator", section="Utilities", status="Warning"),
        models.Equipment(equipment_id="CMP-004", name="Air Compressor", type="Compressor", section="Packaging", status="Maintenance"),
    ]
    db.bulk_save_objects(equipments)
    db.commit()
    
    equipments_db = db.query(models.Equipment).all()
    eq_map = {eq.equipment_id: eq.id for eq in equipments_db}

    print("Seeding Equipment Parameters...")
    parameters = [
        models.EquipmentParameter(equipment_id=eq_map["PMP-001"], parameter_name="Temperature", unit="°C", min_normal=40, max_normal=80, min_warning=80, max_warning=90, critical_threshold=90),
        models.EquipmentParameter(equipment_id=eq_map["PMP-001"], parameter_name="Pressure", unit="bar", min_normal=3.0, max_normal=5.0, min_warning=5.0, max_warning=6.0, critical_threshold=6.0),
        models.EquipmentParameter(equipment_id=eq_map["PMP-001"], parameter_name="RPM", unit="RPM", min_normal=1400, max_normal=1600, min_warning=1600, max_warning=1700, critical_threshold=1700),
        models.EquipmentParameter(equipment_id=eq_map["PMP-001"], parameter_name="Vibration", unit="mm/s", min_normal=0.5, max_normal=2.5, min_warning=2.5, max_warning=4.0, critical_threshold=4.0),
        
        models.EquipmentParameter(equipment_id=eq_map["GEN-003"], parameter_name="Temperature", unit="°C", min_normal=50, max_normal=85, min_warning=85, max_warning=90, critical_threshold=90),
    ]
    db.bulk_save_objects(parameters)
    db.commit()

    print("Seeding Logbook Entries...")
    entries = [
        models.LogbookEntry(equipment_id=eq_map["BLR-002"], operator_id=1, shift="Morning", status="Approved", supervisor_id=2, data={"Temperature": "75.0"}),
        models.LogbookEntry(equipment_id=eq_map["PMP-001"], operator_id=1, shift="Morning", status="Submitted", data={"Temperature": "72.4", "Pressure": "4.2", "RPM": "1450", "Vibration": "2.1"}),
    ]
    db.bulk_save_objects(entries)
    db.commit()

    print("Seeding Alerts...")
    alerts = [
        models.Alert(equipment_id=eq_map["GEN-003"], parameter="Temperature", reading=96.4, threshold=90.0, severity="Critical", status="Open"),
    ]
    db.bulk_save_objects(alerts)
    db.commit()

    print("Seeding Phase 2 Data (Handovers, Signatures, Audit Log)...")
    
    # Handovers
    handovers = [
        models.ShiftHandover(
            section="Utilities", 
            outgoing_user_id=1, 
            entries_count=12, 
            anomaly_count=1, 
            notes="Cooling pump #2 bearing sounding slightly loud, keep an eye on vibration. Otherwise smooth shift.",
            status="pending"
        ),
        models.ShiftHandover(
            section="Production", 
            outgoing_user_id=1, 
            incoming_user_id=2, 
            entries_count=24, 
            anomaly_count=0, 
            notes="All normal.",
            status="acknowledged"
        )
    ]
    db.bulk_save_objects(handovers)
    db.commit()

    # Signatures
    signatures = [
        models.Signature(entity_type="log_entry", entity_id=1, user_id=1, user_role="Operator", meaning="author"),
        models.Signature(entity_type="log_entry", entity_id=1, user_id=2, user_role="Supervisor", meaning="approver"),
        models.Signature(entity_type="log_entry", entity_id=2, user_id=1, user_role="Operator", meaning="author")
    ]
    db.bulk_save_objects(signatures)
    db.commit()

    # Audit Logs
    audit_logs = [
        models.AuditLog(actor_user_id=1, actor_role="Operator", action="Logbook Submitted", entity_type="log_entry", entity_id=1, description="Logbook submitted for BLR-002"),
        models.AuditLog(actor_user_id=2, actor_role="Supervisor", action="Logbook Approved", entity_type="log_entry", entity_id=1, description="Logbook approved"),
        models.AuditLog(actor_user_id=1, actor_role="Operator", action="Logbook Submitted", entity_type="log_entry", entity_id=2, description="Logbook submitted for PMP-001"),
        models.AuditLog(actor_user_id=1, actor_role="Operator", action="Handover Created", entity_type="handover", entity_id=1, description="Shift handover created for Utilities")
    ]
    db.bulk_save_objects(audit_logs)
    db.commit()
    
    print("Seeding complete.")

if __name__ == "__main__":
    seed_data()
