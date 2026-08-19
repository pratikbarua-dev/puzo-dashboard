/**
 * Client-side mirror of the backend's weather formatting
 * (`puzo/src/modules/weather/weather.format.js`). The backend caches a compact
 * JSON payload in `device_settings.weather_cache`; the dashboard reads that same
 * value so the OLED preview shows exactly what the hardware is displaying.
 */

export const WMO_LABELS: Record<number, string> = {
  0: 'Sunny',
  1: 'Mostly Sunny',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light Drizzle',
  53: 'Drizzle',
  55: 'Heavy Drizzle',
  56: 'Freezing Drizzle',
  57: 'Freezing Drizzle',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  66: 'Freezing Rain',
  67: 'Freezing Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  77: 'Snow Grains',
  80: 'Light Showers',
  81: 'Showers',
  82: 'Heavy Showers',
  85: 'Snow Showers',
  86: 'Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Thunderstorm',
};

export interface WeatherSnapshot {
  city: string | null;
  temperatureC: number | null;
  humidity: number | null;
  windMps: number | null;
  weatherCode: number | null;
  /** e.g. "Partly Cloudy" — null when the code is unknown. */
  label: string | null;
}

/**
 * Parses `device_settings.weather_cache`. Returns null when the field is empty
 * or unparseable, which is the case until the backend's weather job has run for
 * an owner with coordinates on file.
 */
export function parseWeatherCache(raw?: string | null): WeatherSnapshot | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const p = parsed as Record<string, unknown>;
  const code = typeof p.weather_code === 'number' ? p.weather_code : null;
  const snapshot: WeatherSnapshot = {
    city: typeof p.city === 'string' && p.city.trim() ? p.city.trim() : null,
    temperatureC: typeof p.temperature_c === 'number' ? p.temperature_c : null,
    humidity: typeof p.humidity === 'number' ? p.humidity : null,
    windMps: typeof p.wind_mps === 'number' ? p.wind_mps : null,
    weatherCode: code,
    label: code != null ? WMO_LABELS[code] ?? null : null,
  };

  const hasAnything =
    snapshot.city || snapshot.temperatureC != null || snapshot.label || snapshot.humidity != null;
  return hasAnything ? snapshot : null;
}
