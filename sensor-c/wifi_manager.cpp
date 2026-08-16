#include <Arduino.h>
#include <WiFi.h>

#include "wifi_manager.h"
#include "secrets.h"

void connectWiFi()
{

    Serial.println();

    Serial.print("Connecting to WiFi");

    WiFi.begin(
        WIFI_SSID,
        WIFI_PASSWORD
    );

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);

        Serial.print(".");
    }

    Serial.println();

    Serial.println("WiFi Connected");

    Serial.print("IP : ");

    Serial.println(
        WiFi.localIP()
    );
}