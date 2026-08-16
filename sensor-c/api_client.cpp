#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

#include "api_client.h"
#include "sensors.h"
#include "utils.h"
#include "secrets.h"

void sendSensorData()
{

    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("WiFi Disconnected");
        return;
    }

    HTTPClient http;

    http.begin(API_URL);

    http.addHeader("Content-Type", "application/json");

    int soil = soilPercent(soilRaw);

    int rain = rainPercent(rainRaw);

    int tds = tdsPPM(tdsRaw);

    String json = "{";

    json += "\"water_level\":" + String(waterLevel,2) + ",";

    json += "\"air_temperature\":" + String(airTemperature,2) + ",";

    json += "\"humidity\":" + String(humidity,2) + ",";

    json += "\"water_temperature\":" + String(waterTemperature,2) + ",";

    json += "\"soil\":" + String(soil) + ",";

    json += "\"rain\":" + String(rain) + ",";

    json += "\"tds\":" + String(tds);

    json += "}";

    int response = http.POST(json);

    Serial.println();

    Serial.println("========== API ==========");

    Serial.print("HTTP Code : ");

    Serial.println(response);

    Serial.println(json);

    Serial.println("=========================");

    http.end();

}