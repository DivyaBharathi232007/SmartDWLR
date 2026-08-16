#ifndef ANALYSIS_H
#define ANALYSIS_H

String waterLevelStatus(float level);

String waterQualityStatus(int tds);

String soilStatus(int soil);

String rainStatus(int rain);

String temperatureStatus(float temp);

String groundwaterRecommendation(
    float level,
    int tds,
    int soil,
    int rain
);

#endif