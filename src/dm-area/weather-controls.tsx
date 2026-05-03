import * as React from "react";
import graphql from "babel-plugin-relay/macro";
import { useFragment, useMutation } from "relay-hooks";
import {
  VStack,
  HStack,
  Heading,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  Box,
} from "@chakra-ui/react";
import { Toolbar } from "../toolbar";
import type { WeatherType } from "../weather-types";
import { weatherControls_MapFragment$key } from "./__generated__/weatherControls_MapFragment.graphql";
import { weatherControls_mapUpdateWeatherMutation } from "./__generated__/weatherControls_mapUpdateWeatherMutation.graphql";

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
];

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
      <VStack minWidth="280px" padding="3" spacing="3" align="stretch">
        <Heading size="xs">Météo</Heading>

        <HStack spacing="2" flexWrap="wrap">
          {WEATHER_OPTIONS.map((opt) => (
            <Box
              key={opt.type}
              as="button"
              px="3"
              py="2"
              borderRadius="md"
              fontSize="sm"
              fontWeight={weather.type === opt.type ? "bold" : "normal"}
              bg={weather.type === opt.type ? "blue.600" : "gray.700"}
              color="white"
              _hover={{ bg: "blue.500" }}
              onClick={() => apply({ type: opt.type })}
            >
              {opt.emoji} {opt.label}
            </Box>
          ))}
        </HStack>

        {weather.type !== "none" && (
          <>
            <Box>
              <HStack justifyContent="space-between" mb="1">
                <Text fontSize="sm">Intensité</Text>
                <Text fontSize="sm" color="gray.400">
                  {Math.round(weather.intensity * 100)}%
                </Text>
              </HStack>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={weather.intensity}
                onChange={(v) => apply({ intensity: v })}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>

            {weather.type !== "sun" && (
              <Box>
                <HStack justifyContent="space-between" mb="1">
                  <Text fontSize="sm">Direction du vent</Text>
                  <Text fontSize="sm" color="gray.400">
                    {Math.round(weather.windAngle)}°
                  </Text>
                </HStack>
                <Slider
                  min={-60}
                  max={60}
                  step={5}
                  value={weather.windAngle}
                  onChange={(v) => apply({ windAngle: v })}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </Box>
            )}
          </>
        )}
      </VStack>
    </Toolbar.Popup>
  );
};
