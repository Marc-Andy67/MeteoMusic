// context/WeatherContext.tsx
import { createContext, use, useState, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import {
  weatherCodeToMoodId,
  WEATHER_MOODS,
  loadPlaylists,
  WeatherMood,
} from '../storage/playlist';
import { usePlayer } from './PlayerContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type WeatherState = {
  temperature:  number | null;
  weatherCode:  number | null;
  cityName:     string | null;
  currentMood:  WeatherMood | null;
  active:       boolean;
  errorMsg:     string | null;
  activate:     () => Promise<void>;
  deactivate:   () => void;
};

const WeatherContext = createContext<WeatherState | null>(null);

export function useWeather() {
  const ctx = use(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used inside WeatherProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const player = usePlayer();

  const [temperature,  setTemperature]  = useState<number | null>(null);
  const [weatherCode,  setWeatherCode]  = useState<number | null>(null);
  const [cityName,     setCityName]     = useState<string | null>(null);
  const [currentMood,  setCurrentMood]  = useState<WeatherMood | null>(null);
  const [active,       setActive]       = useState(false);
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null);

  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  // Garde en mémoire le dernier moodId pour détecter les changements
  const lastMoodIdRef  = useRef<string | null>(null);

  // ── Récupère météo + ville ─────────────────────────────────────────────────
  const fetchMeteo = useCallback(async (lat: number, lon: number) => {
    try {
      // Météo
      const res  = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
      );
      const data = await res.json();
      const temp = data.current.temperature_2m as number;
      const code = data.current.weather_code  as number;

      setTemperature(temp);
      setWeatherCode(code);

      // Ville
      const geoRes  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'User-Agent': 'MeteoMusicApp/1.0' } }
      );
      const geoData = await geoRes.json();
      setCityName(
        geoData.address?.city ||
        geoData.address?.town ||
        geoData.address?.village ||
        'Ville inconnue'
      );

      // ── Détecte changement de mood ─────────────────────────────────────────
      const moodId = weatherCodeToMoodId(code);
      const mood   = WEATHER_MOODS.find(m => m.id === moodId) ?? null;
      setCurrentMood(mood);

      // Lance une playlist seulement si le mood a changé
      if (moodId !== lastMoodIdRef.current) {
        lastMoodIdRef.current = moodId;
        await autoPlayForMood(moodId);
      }
    } catch (e) {
      console.error('[WeatherContext] fetchMeteo error:', e);
    }
  }, []);

  // ── Cherche et lance la playlist correspondant au mood ─────────────────────
  const autoPlayForMood = useCallback(async (moodId: string) => {
    const playlists = await loadPlaylists();
    // Cherche une playlist ayant cet id météo ET au moins 1 track
    const match = playlists.find(
      p => p.weatherId === moodId && p.tracks.length > 0
    );
    if (match) {
      console.log(`[WeatherContext] Mood changé → "${moodId}" → playlist "${match.name}"`);
      await player.playPlaylist(match.tracks, match.name, 0);
    } else {
      console.log(`[WeatherContext] Mood "${moodId}" → aucune playlist assignée`);
    }
  }, [player]);

  // ── Activation ────────────────────────────────────────────────────────────
  const activate = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission refusée');
      return;
    }
    setErrorMsg(null);

    const loc = await Location.getCurrentPositionAsync({});
    setActive(true);
    await fetchMeteo(loc.coords.latitude, loc.coords.longitude);

    // Rafraîchit toutes les 2 minutes
    intervalRef.current = setInterval(async () => {
      const newLoc = await Location.getCurrentPositionAsync({});
      await fetchMeteo(newLoc.coords.latitude, newLoc.coords.longitude);
    }, 120000);
  }, [fetchMeteo]);

  // ── Désactivation ─────────────────────────────────────────────────────────
  const deactivate = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActive(false);
    setTemperature(null);
    setWeatherCode(null);
    setCityName(null);
    setCurrentMood(null);
    lastMoodIdRef.current = null;
  }, []);

  return (
    <WeatherContext value={{
      temperature, weatherCode, cityName, currentMood,
      active, errorMsg, activate, deactivate,
    }}>
      {children}
    </WeatherContext>
  );
}