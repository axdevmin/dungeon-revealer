export type WeatherType =
  | "none"
  | "rain"
  | "storm"
  | "snow"
  | "sun"
  | "moon"
  | "wind";

export type WeatherSettings = {
  type: WeatherType;
  intensity: number;
  windAngle: number;
};
