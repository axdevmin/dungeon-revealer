export type WeatherType = "none" | "rain" | "storm" | "snow" | "sun";

export type WeatherSettings = {
  type: WeatherType;
  intensity: number;
  windAngle: number;
};
