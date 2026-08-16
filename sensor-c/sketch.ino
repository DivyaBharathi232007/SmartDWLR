#include <Arduino.h>
#include "config.h"
#include "sensors.h"
#include "dashboard.h"
#include "wifi_manager.h"
#include "api_client.h"

void setup()
{
  Serial.begin(115200);

  initSensors();

  connectWiFi();

  Serial.println();
  Serial.println("SMART DWLR SYSTEM STARTED");
}

void loop()
{
  readWaterLevel();

  readDHT();

  readWaterTemperature();

  readSoil();

  readRain();

  readTDS();

  printDashboard();

  sendSensorData();

  delay(5000);
}