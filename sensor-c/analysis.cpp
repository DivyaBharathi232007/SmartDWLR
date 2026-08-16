#include <Arduino.h>
#include "analysis.h"

//------------------------------------
// Water Level
//------------------------------------

String waterLevelStatus(float level)
{
    if(level>70)
        return "GOOD";

    if(level>40)
        return "WARNING";

    return "CRITICAL";
}

//------------------------------------
// Water Quality
//------------------------------------

String waterQualityStatus(int tds)
{
    if(tds<300)
        return "EXCELLENT";

    if(tds<600)
        return "GOOD";

    if(tds<900)
        return "MODERATE";

    return "POOR";
}

//------------------------------------
// Soil
//------------------------------------

String soilStatus(int soil)
{
    if(soil>70)
        return "WET";

    if(soil>40)
        return "NORMAL";

    return "DRY";
}

//------------------------------------
// Rain
//------------------------------------

String rainStatus(int rain)
{
    if(rain>70)
        return "HEAVY";

    if(rain>30)
        return "LIGHT";

    return "NO RAIN";
}

//------------------------------------
// Water Temperature
//------------------------------------

String temperatureStatus(float temp)
{
    if(temp<20)
        return "LOW";

    if(temp<35)
        return "NORMAL";

    return "HIGH";
}

//------------------------------------
// Recommendation
//------------------------------------

String groundwaterRecommendation(
float level,
int tds,
int soil,
int rain)
{

    if(level<30)
        return "Groundwater critically low.";

    if(tds>900)
        return "Water quality poor.";

    if(soil<20)
        return "Soil is dry.";

    if(rain<20)
        return "Need rainfall recharge.";

    return "Groundwater condition is healthy.";
}