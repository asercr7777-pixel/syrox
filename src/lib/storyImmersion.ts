import { useState, useEffect, useMemo } from 'react';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type WeatherType = 'clear' | 'fog' | 'rain' | 'storm' | 'snow' | 'void';

export interface ImmersionState {
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  ambientColor: string;
  fogOpacity: number;
  particleCount: number;
  brightness: number;
  isNight: boolean;
}

export function useImmersion(): ImmersionState {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    const hour = now.getHours();

    let timeOfDay: TimeOfDay;
    let ambientColor: string;
    let brightness: number;
    let fogOpacity: number;
    let isNight = false;

    if (hour >= 5 && hour < 8) {
      timeOfDay = 'dawn';
      ambientColor = '#f59e0b';
      brightness = 0.6;
      fogOpacity = 0.3;
    } else if (hour >= 8 && hour < 17) {
      timeOfDay = 'day';
      ambientColor = '#3b82f6';
      brightness = 1;
      fogOpacity = 0.1;
    } else if (hour >= 17 && hour < 20) {
      timeOfDay = 'dusk';
      ambientColor = '#f97316';
      brightness = 0.7;
      fogOpacity = 0.2;
    } else {
      timeOfDay = 'night';
      ambientColor = '#7c3aed';
      brightness = 0.4;
      fogOpacity = 0.35;
      isNight = true;
    }

    const weatherSeed = Math.floor(now.getTime() / (1000 * 60 * 60 * 6));
    const weatherCycle = weatherSeed % 6;
    const weatherTypes: WeatherType[] = ['clear', 'fog', 'rain', 'storm', 'snow', 'void'];
    const weather = weatherTypes[weatherCycle];

    if (weather === 'fog') fogOpacity = Math.max(fogOpacity, 0.4);
    if (weather === 'storm') brightness = Math.max(0.3, brightness - 0.2);
    if (weather === 'void') { ambientColor = '#1e1b4b'; brightness = 0.3; fogOpacity = 0.5; }

    const particleCount = isNight ? 50 : 30;

    return { timeOfDay, weather, ambientColor, fogOpacity, particleCount, brightness, isNight };
  }, [now]);
}

export function getTimeLabel(tod: TimeOfDay): string {
  return tod.charAt(0).toUpperCase() + tod.slice(1);
}

export function getWeatherLabel(w: WeatherType): string {
  const labels: Record<WeatherType, string> = { clear: 'Clear Skies', fog: 'Heavy Fog', rain: 'Rainfall', storm: 'Thunderstorm', snow: 'Snowfall', void: 'Void Rift' };
  return labels[w];
}

export function getWeatherEmoji(w: WeatherType): string {
  const emojis: Record<WeatherType, string> = { clear: '☀️', fog: '🌫️', rain: '🌧️', storm: '⛈️', snow: '❄️', void: '🕳️' };
  return emojis[w];
}
