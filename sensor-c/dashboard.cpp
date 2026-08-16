#include <Arduino.h>

#include "dashboard.h"
#include "sensors.h"
#include "utils.h"
#include "analysis.h"

void printDashboard()
{

    int soil = soilPercent(soilRaw);

    int rain = rainPercent(rainRaw);

    int tds = tdsPPM(tdsRaw);

    int health = groundwaterHealth(
        soil,
        rain,
        tds,
        waterLevel,
        waterTemperature);

    Serial.println();

    Serial.println("====================================");

    Serial.println(" SMART DWLR SYSTEM ");

    Serial.println("====================================");

    Serial.print("Water Level      : ");
    Serial.print(waterLevel);
    Serial.println(" cm");

    Serial.print("Level Status     : ");
    Serial.println(waterLevelStatus(waterLevel));

    Serial.print("Air Temp         : ");
    Serial.print(airTemperature);
    Serial.println(" C");

    Serial.print("Humidity         : ");
    Serial.print(humidity);
    Serial.println(" %");

    Serial.print("Water Temp       : ");
    Serial.print(waterTemperature);
    Serial.println(" C");

    Serial.print("Temperature     : ");
    Serial.println(temperatureStatus(waterTemperature));

    Serial.print("Soil Moisture    : ");
    Serial.print(soil);
    Serial.println(" %");

    Serial.print("Soil Status     : ");
    Serial.println(soilStatus(soil));

    Serial.print("Rain Level       : ");
    Serial.print(rain);
    Serial.println(" %");

    Serial.print("Rain Status     : ");
    Serial.println(rainStatus(rain));

    Serial.print("TDS              : ");
    Serial.print(tds);
    Serial.println(" ppm");

    Serial.print("Water Quality    : ");
    Serial.println(waterQualityStatus(tds));
    
    Serial.print("Health Score     : ");
    Serial.print(health);
    Serial.println("/100");

    Serial.print("Recommendation  : ");

    Serial.println(groundwaterRecommendation(waterLevel,tds,soil,rain));

    Serial.println("====================================");
}