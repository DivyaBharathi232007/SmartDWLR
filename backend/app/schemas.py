from typing import Optional
from pydantic import BaseModel, Field


class SensorPayload(BaseModel):
    """Matches api_client.cpp exactly — do not rename these fields, or
    update the Wokwi sketch to match if you change the schema."""
    water_level: float
    air_temperature: float
    humidity: float
    water_temperature: float
    soil: int
    rain: int
    tds: int
    borewell_id: Optional[str] = Field(default="BW01")
    language: Optional[str] = Field(default="en")
    wifi_rssi: Optional[int] = Field(
        default=None,
        description="WiFi signal strength in dBm (e.g. WiFi.RSSI() on ESP32). "
                     "Optional — omit if the hardware doesn't report it.",
    )