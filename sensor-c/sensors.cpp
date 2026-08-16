#include <Arduino.h>
#include "config.h"
#include "sensors.h"

#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ----------------------------
// Create Sensor Objects
// ----------------------------
DHT dht(DHTPIN, DHTTYPE);

OneWire oneWire(ONE_WIRE_BUS);

DallasTemperature waterSensor(&oneWire);

// ----------------------------
// Global Variables
// ----------------------------
float waterLevel = 0;

float airTemperature = 0;

float humidity = 0;

float waterTemperature = 0;

int soilRaw = 0;

int rainRaw = 0;

int tdsRaw = 0;

// ----------------------------
// Initialize Sensors
// ----------------------------
void initSensors()
{
    pinMode(TRIG_PIN, OUTPUT);

    pinMode(ECHO_PIN, INPUT);

    dht.begin();

    waterSensor.begin();
}

// ----------------------------
// Water Level
// ----------------------------
void readWaterLevel()
{
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);

    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);

    digitalWrite(TRIG_PIN, LOW);

    long duration = pulseIn(ECHO_PIN, HIGH);

    float distance = duration * 0.0343 / 2;

    waterLevel = BOREWELL_DEPTH_CM - distance;
}

// ----------------------------
// DHT22
// ----------------------------
void readDHT()
{
    airTemperature = dht.readTemperature();

    humidity = dht.readHumidity();
}

// ----------------------------
// DS18B20
// ----------------------------
void readWaterTemperature()
{
    waterSensor.requestTemperatures();

    waterTemperature = waterSensor.getTempCByIndex(0);
}

// ----------------------------
// Soil Moisture
// ----------------------------
void readSoil()
{
    soilRaw = analogRead(SOIL_PIN);
}

// ----------------------------
// Rain Sensor
// ----------------------------
void readRain()
{
    rainRaw = analogRead(RAIN_PIN);
}

// ----------------------------
// TDS
// ----------------------------
void readTDS()
{
    tdsRaw = analogRead(TDS_PIN);
}