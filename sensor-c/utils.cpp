#include <Arduino.h>
#include "utils.h"

//----------------------------------
// Soil Percentage
//----------------------------------

int soilPercent(int raw)
{
    return map(raw, 0, 4095, 0, 100);
}

//----------------------------------
// Rain Percentage
//----------------------------------

int rainPercent(int raw)
{
    return map(raw, 0, 4095, 0, 100);
}

//----------------------------------
// TDS ppm
//----------------------------------

int tdsPPM(int raw)
{
    return map(raw, 0, 4095, 0, 1000);
}

//----------------------------------
// Groundwater Health Score
//----------------------------------

int groundwaterHealth(
    int soil,
    int rain,
    int tds,
    float waterLevel,
    float waterTemp)
{

    int score = 100;

    if (waterLevel < 30)
        score -= 25;

    if (tds > 700)
        score -= 25;

    if (soil < 30)
        score -= 15;

    if (rain < 20)
        score -= 10;

    if (waterTemp > 35)
        score -= 10;

    if (score < 0)
        score = 0;

    return score;
}