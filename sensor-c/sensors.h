#ifndef SENSORS_H
#define SENSORS_H

void initSensors();

void readWaterLevel();

void readDHT();

void readWaterTemperature();

void readSoil();

void readRain();

void readTDS();

// Global Variables

extern float waterLevel;

extern float airTemperature;

extern float humidity;

extern float waterTemperature;

extern int soilRaw;

extern int rainRaw;

extern int tdsRaw;

#endif