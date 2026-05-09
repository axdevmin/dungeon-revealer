import * as React from "react";
import graphql from "babel-plugin-relay/macro";
import { useFragment, useMutation } from "relay-hooks";
import styled from "@emotion/styled/macro";
import { Toolbar } from "../toolbar";
import type { WeatherType } from "../weather-types";
import { weatherControls_MapFragment$key } from "./__generated__/weatherControls_MapFragment.graphql";
import { weatherControls_mapUpdateWeatherMutation } from "./__generated__/weatherControls_mapUpdateWeatherMutation.graphql";
import { ds } from "../design-system";

const WeatherControlsMapFragment = graphql`
  fragment weatherControls_MapFragment on Map {
    id
    weatherSettings {
      type
      intensity
      windAngle
    }
  }
`;

const MapUpdateWeatherMutation = graphql`
  mutation weatherControls_mapUpdateWeatherMutation(
    $input: MapUpdateWeatherInput!
  ) {
    mapUpdateWeather(input: $input) {
      updatedMap {
        weatherSettings {
          type
          intensity
          windAngle
        }
      }
    }
  }
`;

type WeatherOption = {
  type: WeatherType;
  label: string;
  emoji: string;
};

const WEATHER_OPTIONS: WeatherOption[] = [
  { type: "none", label: "Aucun", emoji: "—" },
  { type: "sun", label: "Soleil", emoji: "☀️" },
  { type: "rain", label: "Pluie", emoji: "🌧️" },
  { type: "storm", label: "Orage", emoji: "⛈️" },
  { type: "snow", label: "Neige", emoji: "❄️" },
  { type: "wind", label: "Vent", emoji: "💨" },
  { type: "moon", label: "Lune", emoji: "🌙" },
];

const Container = styled.div`
  padding: 14px;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Title = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${ds.colors.textMuted};
  font-family: ${ds.font.sans};
`;

const WeatherGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
`;

const WeatherBtn = styled.button<{ isActive: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 6px 8px;
  border-radius: ${ds.radii.md};
  border: 1px solid
    ${(p) => (p.isActive ? ds.colors.accentBorder : ds.colors.border)};
  background: ${(p) =>
    p.isActive ? ds.colors.accentMuted : "rgba(255,255,255,0.03)"};
  color: ${(p) => (p.isActive ? ds.colors.accent : ds.colors.textSecondary)};
  cursor: pointer;
  font-family: ${ds.font.sans};
  font-size: 11px;
  font-weight: ${(p) => (p.isActive ? "600" : "400")};
  transition: all ${ds.transitions.fast};

  span.emoji {
    font-size: 18px;
    line-height: 1;
  }

  &:hover {
    background: ${ds.colors.surfaceHover};
    border-color: ${ds.colors.borderStrong};
    color: ${ds.colors.textPrimary};
  }
`;

const SliderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: ${ds.colors.textSecondary};
  font-family: ${ds.font.sans};

  span.value {
    color: ${ds.colors.textMuted};
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }
`;

const SliderInput = styled.input`
  width: 100%;
`;

export const WeatherControls = (props: {
  map: weatherControls_MapFragment$key;
}): React.ReactElement => {
  const map = useFragment(WeatherControlsMapFragment, props.map);
  const [updateWeather] = useMutation<weatherControls_mapUpdateWeatherMutation>(
    MapUpdateWeatherMutation
  );

  const weather = map.weatherSettings;

  const apply = (patch: Partial<typeof weather>) => {
    updateWeather({
      variables: {
        input: {
          mapId: map.id,
          weatherSettings: {
            type: patch.type ?? weather.type,
            intensity: patch.intensity ?? weather.intensity,
            windAngle: patch.windAngle ?? weather.windAngle,
          },
        },
      },
    });
  };

  return (
    <Toolbar.Popup>
      <Container>
        <Title>Météo</Title>

        <WeatherGrid>
          {WEATHER_OPTIONS.map((opt) => (
            <WeatherBtn
              key={opt.type}
              isActive={weather.type === opt.type}
              onClick={() => apply({ type: opt.type })}
            >
              <span className="emoji">{opt.emoji}</span>
              <span>{opt.label}</span>
            </WeatherBtn>
          ))}
        </WeatherGrid>

        {weather.type !== "none" && (
          <>
            <SliderRow>
              <SliderLabel>
                <span>Intensité</span>
                <span className="value">
                  {Math.round(weather.intensity * 100)}%
                </span>
              </SliderLabel>
              <SliderInput
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={weather.intensity}
                onChange={(e) =>
                  apply({ intensity: parseFloat(e.target.value) })
                }
              />
            </SliderRow>

            {weather.type !== "sun" && weather.type !== "moon" && (
              <SliderRow>
                <SliderLabel>
                  <span>Direction du vent</span>
                  <span className="value">
                    {Math.round(weather.windAngle)}°
                  </span>
                </SliderLabel>
                <SliderInput
                  type="range"
                  min={-60}
                  max={60}
                  step={5}
                  value={weather.windAngle}
                  onChange={(e) =>
                    apply({ windAngle: parseFloat(e.target.value) })
                  }
                />
              </SliderRow>
            )}
          </>
        )}
      </Container>
    </Toolbar.Popup>
  );
};
