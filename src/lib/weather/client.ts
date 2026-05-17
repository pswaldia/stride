const WMO_CONDITIONS: Record<number, string> = {
  0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Foggy', 51: 'Light drizzle', 53: 'Drizzle',
  55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Showers',
  81: 'Rain showers', 82: 'Heavy showers', 95: 'Thunderstorm',
  96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
}

export interface WeatherData {
  temp_c: number
  feels_like_c: number
  humidity_pct: number
  wind_kph: number
  wind_dir_deg: number
  conditions: string
  weather_code: number
}

export async function fetchWeatherForRun(
  lat: number,
  lng: number,
  date: string,     // YYYY-MM-DD
  hour: number      // 0-23 UTC
): Promise<WeatherData | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      start_date: date,
      end_date: date,
      hourly: [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'wind_speed_10m',
        'wind_direction_10m',
        'weather_code',
      ].join(','),
      timezone: 'UTC',
      wind_speed_unit: 'kmh',
    })

    const res = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?${params}`,
      { next: { revalidate: 0 } }
    )

    if (!res.ok) {
      console.error(`Open-Meteo API error: ${res.status}`)
      return null
    }

    const data = await res.json()
    const idx = Math.min(hour, (data.hourly?.time?.length ?? 1) - 1)

    const weatherCode = data.hourly.weather_code?.[idx] ?? 0

    return {
      temp_c: Math.round((data.hourly.temperature_2m?.[idx] ?? 20) * 10) / 10,
      feels_like_c: Math.round((data.hourly.apparent_temperature?.[idx] ?? 20) * 10) / 10,
      humidity_pct: Math.round(data.hourly.relative_humidity_2m?.[idx] ?? 50),
      wind_kph: Math.round((data.hourly.wind_speed_10m?.[idx] ?? 0) * 10) / 10,
      wind_dir_deg: Math.round(data.hourly.wind_direction_10m?.[idx] ?? 0),
      weather_code: weatherCode,
      conditions: WMO_CONDITIONS[weatherCode] ?? 'Unknown',
    }
  } catch (err) {
    console.error('Failed to fetch weather:', err)
    return null
  }
}
