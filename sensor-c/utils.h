#ifndef UTILS_H
#define UTILS_H

int soilPercent(int raw);

int rainPercent(int raw);

int tdsPPM(int raw);

int groundwaterHealth(
    int soil,
    int rain,
    int tds,
    float waterLevel,
    float waterTemp
);

#endif