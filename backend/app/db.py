"""Database setup for Smart DWLR.

This defaults to SQLite for local development, but can be switched to MySQL
by setting environment variables or a DATABASE_URL.
"""
import os
from datetime import datetime
from typing import Optional
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import inspect, text
from sqlmodel import Field, SQLModel, Session, create_engine

load_dotenv()


def _build_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        # Convert postgresql:// to postgresql+psycopg:// for psycopg v3
        if database_url.startswith("postgresql://"):
            database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
        return database_url

    use_mysql = os.getenv("USE_MYSQL", "").strip().lower() in {"1", "true", "yes", "y", "on"}
    if use_mysql:
        user = quote_plus(os.getenv("DB_USER", "root"))
        password = quote_plus(os.getenv("DB_PASSWORD", ""))
        host = os.getenv("DB_HOST", "localhost")
        port = os.getenv("DB_PORT", "3306")
        name = os.getenv("DB_NAME", "smart_dwlr")
        return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}"

    return "sqlite:///./smart_dwlr.db"


def _engine_kwargs() -> dict:
    database_url = _build_database_url()
    if database_url.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}
    return {"pool_pre_ping": True}


DATABASE_URL = _build_database_url()
engine = create_engine(DATABASE_URL, echo=False, **_engine_kwargs())


class Reading(SQLModel, table=True):
    """One row = one sensor payload received from the ESP32 (or the seed script)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    borewell_id: str = Field(default="BW01", index=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)

    # --- raw fields sent by the ESP32 sketch (api_client.cpp) ---
    water_level: float          # cm below top (distance-derived, BOREWELL_DEPTH_CM - distance)
    air_temperature: float      # deg C (DHT22)
    humidity: float             # % (DHT22)
    water_temperature: float    # deg C (DS18B20)
    soil: int                   # % (mapped from analog soil sensor)
    rain: int                   # % intensity (mapped from analog rain sensor)
    tds: int                    # ppm

    # --- derived / estimated fields (no physical sensor yet) ---
    ph: float = Field(default=7.0)          # estimated from TDS until a real pH probe is added
    turbidity: float = Field(default=5.0)   # estimated from rainfall until a real turbidity probe is added
    recharge_index: float = Field(default=50.0)  # derived from rainfall + soil moisture trend

    # --- computed metrics stored alongside for fast history queries ---
    ghi: Optional[float] = None
    ghi_status: Optional[str] = None
    risk: Optional[str] = None

    # --- SMS delivery tracking (set at ingest time when an alert fires) ---
    sms_sent: Optional[bool] = None
    sms_mode: Optional[str] = None  # "traccar" | "demo" | "error" | None (no alert fired)

    # --- real hardware telemetry (only present if the sender includes it) ---
    wifi_rssi: Optional[int] = None  # dBm, e.g. WiFi.RSSI() on ESP32 — None if not reported


class Borewell(SQLModel, table=True):
    """Static metadata about a borewell/device — depth is what turns a raw
    water_level distance reading into a meaningful percentage."""
    id: Optional[int] = Field(default=None, primary_key=True)
    borewell_id: str = Field(index=True, unique=True)
    name: str = "Borewell 01"
    district: str = "Chennai"
    depth_cm: float = 100.0   # matches config.h BOREWELL_DEPTH_CM in the Wokwi sketch
    status: str = "Online"


def _auto_migrate(engine) -> None:
    """Add any model columns missing from an already-existing table.

    SQLModel.metadata.create_all() only creates tables that don't exist yet —
    it silently does nothing for tables that already exist but are missing
    newly-added columns (e.g. sms_sent/sms_mode added after the DB was first
    created). Without this, an existing MySQL/SQLite database from before
    that change raises "Unknown column" on every read. This adds whatever is
    missing, so no manual ALTER TABLE / migration step is required.
    """
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table in SQLModel.metadata.tables.values():
            if not inspector.has_table(table.name):
                continue  # brand-new table — create_all already handled it
            existing_cols = {c["name"] for c in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name in existing_cols:
                    continue
                col_type = column.type.compile(dialect=conn.dialect)
                nullable = "NULL" if column.nullable else "NOT NULL"
                conn.execute(text(f"ALTER TABLE {table.name} ADD COLUMN {column.name} {col_type} {nullable}"))
                print(f"[DB] Auto-migrated: added missing column '{column.name}' to '{table.name}'")


def init_db():
    SQLModel.metadata.create_all(engine)
    _auto_migrate(engine)
    with Session(engine) as session:
        existing = session.get(Borewell, 1)
        if not existing:
            session.add(Borewell(borewell_id="BW01", name="Borewell 01", district="Chennai", depth_cm=100.0))
            session.commit()


def get_session():
    with Session(engine) as session:
        yield session